const _ = require("lodash");
const async = require("async");
const moment = require("moment-timezone");

const constants = require("../constants");
const channelUtils = require("../util/channels");
const timeUtils = require("../util/time");
const usernameUtils = require("../util/usernames");

module.exports = function(db, appConfig, ircConfig, nicknames) {

	// Utility

	const localMoment = function(arg) {
		return moment(arg).tz(appConfig.configValue("timeZone"));
	};

	// Parsing

	const parseDbLine = function(line, callback) {
		var l = null;
		if (line) {
			l = _.clone(line);

			// Channel and server names

			if (l.channelName && l.serverName) {
				l.channel = channelUtils.getChannelUri(
					l.serverName, l.channelName, l.channelType
				);
			}

			if (l.channelType === constants.CHANNEL_TYPES.PUBLIC) {
				// TODO: Deprecate channelName
				if (l.channelName) {
					l.channelName = "#" + l.channelName;
				}
			}
			else {
				delete l.channelName;
			}

			if (l.serverName) {
				l.server = l.serverName;
				delete l.serverName;
			}

			// Color

			if (l.username) {
				l.color = usernameUtils.getUserColorNumber(l.username);
			}

			// Highlights

			var highlight = [];

			if (l.server) {
				const config = ircConfig.getIrcConfigByName(l.server);

				if (
					config && config.username && l.username &&
					config.username.toLowerCase() !== l.username.toLowerCase()
				) {
					highlight = nicknames.getHighlightStringsForMessage(
						l.message, l.channel, config.username
					);
				}
			}

			l.highlight = highlight;

			// Tags

			if (typeof l.tags === "string") {
				try {
					l.tags = JSON.parse(l.tags);
				} catch(e) {
					// No tags to handle
				}
			}

			// Event data

			if (typeof l.eventData === "string") {
				try {
					l.eventData = JSON.parse(l.eventData);

					// Pipe the event data attributes into the main object
					if (l.eventData) {
						l = _.assign(l, l.eventData);
					}

				} catch(e) {
					// No events to handle
				}
			}

			delete l.channelId;
			delete l.eventData;
		}

		if (typeof callback === "function") {
			callback(null, l);
		}

		return l;
	};

	const parseDbLines = function(lines, callback) {
		const outLines = [];

		lines.forEach((line) => {
			if (line) {
				const l = parseDbLine(line);
				outLines.push(l);
			}
		});

		if (typeof callback === "function") {
			callback(null, outLines);
		}

		return outLines;
	};

	// Single line

	const getLineByLineId = function(lineId, callback) {
		async.waterfall([
			(callback) => db.getLineByLineId(lineId, callback),
			(line, callback) => parseDbLine(line, callback)
		], callback);
	};

	const getLineContext = function(lineId, callback) {
		db.getLineByLineId(lineId, function(err, line) {
			if (err) {
				callback(err);
				return;
			}

			let { channelId, time } = line;

			db.getSurroundingLines(
				channelId,
				time,
				constants.CONTEXT_CACHE_MINUTES,
				constants.CONTEXT_CACHE_LINES,
				function(err, data) {
					if (err) {
						callback(err);
						return;
					}

					// Reverse before
					let { after, before } = data;
					before.reverse();

					// Remove this line
					before = before.filter((line) => line.lineId !== lineId);
					after = after.filter((line) => line.lineId !== lineId);

					// TODO: Remove duplicate lineIds

					// Parse
					before = parseDbLines(before);
					after = parseDbLines(after);

					// Add to contextMessages
					let out = {
						contextMessages: before.concat(after),
						lineId
					};

					callback(null, out);
				}
			);
		});
	};

	// Line counts

	const getDateLineCountForChannel = function(channel, date, callback) {
		let uriData = channelUtils.parseChannelUri(channel);

		if (!uriData) {
			callback(new Error("Invalid channel"));
			return;
		}

		let { channel: channelName, channelType, server } = uriData;

		async.waterfall([
			(callback) => db.getChannelId(server, channelName, channelType, callback),
			(data, callback) => {
				if (data) {
					db.getDateLineCountForChannel(data.channelId, date, callback);
				}
				else {
					callback(new Error("No such channel"));
				}
			}
		], callback);
	};

	const getDateLineCountForUsername = function(username, date, callback) {
		db.getDateLineCountForUsername(username, date, callback);
	};

	// General lookup, with parsing included

	const getDbLines = function(dataCallback, callback) {
		async.waterfall([
			dataCallback,
			(lines, callback) => parseDbLines(lines, callback)
		], callback);
	};

	const resolveChannelId = function(channel, callback) {
		let uriData = channelUtils.parseChannelUri(channel);

		if (!uriData) {
			callback(new Error("Invalid channel"));
			return;
		}

		let { channel: channelName, channelType, server } = uriData;

		db.getChannelId(server, channelName, channelType, callback);
	};

	const getLinesForChannel = function(channel, dataCallback, callback) {
		// Data callback: function(channelId, callback(err, data))
		async.waterfall([
			(callback) => resolveChannelId(channel, callback),
			(data, callback) => {
				if (data) {
					dataCallback(data.channelId, callback);
				}
				else {
					callback(new Error("No such channel"));
				}
			},
			(lines, callback) => parseDbLines(lines, callback)
		], callback);
	};

	// Specific lookups

	const getDateLinesForChannel = function(channel, date, options, callback) {
		getLinesForChannel(
			channel,
			function(channelId, callback) {
				db.getDateLinesForChannel(channelId, date, options, callback);
			},
			callback
		);
	};

	const getMostRecentChannelLines = function(channel, limit, beforeTime, callback) {
		getLinesForChannel(
			channel,
			function(channelId, callback) {
				db.getMostRecentChannelLines(channelId, limit, beforeTime, callback);
			},
			callback
		);
	};

	const getDateLinesForUsername = function(username, date, options, callback) {
		getDbLines(
			(callback) => db.getDateLinesForUsername(username, date, options, callback),
			callback
		);
	};

	const getMostRecentUserLines = function(username, limit, beforeTime, callback) {
		getDbLines(
			(callback) => db.getMostRecentUserLines(username, limit, beforeTime, callback),
			callback
		);
	};

	const getMostRecentAllFriendsLines = function(limit, beforeTime, callback) {
		getDbLines(
			(callback) => db.getMostRecentAllFriendsLines(limit, beforeTime, callback),
			callback
		);
	};

	const getMostRecentHighlightsLines = function(limit, beforeTime, callback) {
		getDbLines(
			(callback) => db.getMostRecentHighlightsLines(limit, beforeTime, callback),
			callback
		);
	};

	// Log details

	const getChannelLogDetails = function(channel, date, callback) {
		const today = timeUtils.ymd(localMoment());
		const yesterday = timeUtils.ymd(localMoment().subtract(1, "day"));

		const calls = [
			(callback) => getDateLineCountForChannel(channel, today, callback),
			(callback) => getDateLineCountForChannel(channel, yesterday, callback)
		];

		if (date && date !== today && date !== yesterday) {
			calls.push(
				(callback) => getDateLineCountForChannel(channel, date, callback)
			);
		}

		async.parallel(calls, (err, results) => {
			if (err) {
				callback(err);
			}
			else {
				const t = results[0], y = results[1];
				const out = {
					[today]: t && t.count || 0,
					[yesterday]: y && y.count || 0
				};

				if (calls.length > 2) {
					const d = results[2];
					out[date] = d && d.count || 0;
				}

				callback(null, out);
			}
		});
	};

	const getUserLogDetails = function(username, date, callback) {
		const today = timeUtils.ymd(localMoment());
		const yesterday = timeUtils.ymd(localMoment().subtract(1, "day"));

		const calls = [
			(callback) => getDateLineCountForUsername(username, today, callback),
			(callback) => getDateLineCountForUsername(username, yesterday, callback)
		];

		if (date && date !== today && date !== yesterday) {
			calls.push(
				(callback) => getDateLineCountForUsername(username, date, callback)
			);
		}

		async.parallel(calls, (err, results) => {
			if (err) {
				callback(err);
			}
			else {
				const t = results[0], y = results[1];
				const out = {
					[today]: t && t.count || 0,
					[yesterday]: y && y.count || 0
				};

				if (calls.length > 2) {
					const d = results[2];
					out[date] = d && d.count || 0;
				}

				callback(null, out);
			}
		});
	};

	return {
		getChannelLogDetails,
		getDateLinesForChannel,
		getDateLinesForUsername,
		getLineByLineId,
		getLineContext,
		getMostRecentAllFriendsLines,
		getMostRecentChannelLines,
		getMostRecentHighlightsLines,
		getMostRecentUserLines,
		getUserLogDetails,
		localMoment
	};
};
