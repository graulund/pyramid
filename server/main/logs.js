const _ = require("lodash");
const async = require("async");
const moment = require("moment-timezone");

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
				l.channel = channelUtils.getChannelUri(l.serverName, l.channelName);
			}

			if (l.channelName) {
				l.channelName = "#" + l.channelName;
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

	// Line counts

	const getDateLineCountForChannel = function(channel, date, callback) {
		let uriData = channelUtils.parseChannelUri(channel);

		if (!uriData) {
			callback(new Error("Invalid channel"));
			return;
		}

		let { channel: channelName, server } = uriData;

		async.waterfall([
			(callback) => db.getChannelId(server, channelName, callback),
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

	const getLinesForChannel = function(channel, dataCallback, callback) {
		// Data callback: function(channelId, callback(err, data))
		let uriData = channelUtils.parseChannelUri(channel);

		if (!uriData) {
			callback(new Error("Invalid channel"));
			return;
		}

		let { channel: channelName, server } = uriData;

		async.waterfall([
			(callback) => db.getChannelId(server, channelName, callback),
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
		getMostRecentAllFriendsLines,
		getMostRecentChannelLines,
		getMostRecentHighlightsLines,
		getMostRecentUserLines,
		getUserLogDetails,
		localMoment
	};
};
