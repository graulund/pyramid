const async  = require("async");
const _ = require("lodash");
const moment = require("moment-timezone");

const channelUtils = require("../util/channels");
const timeUtils = require("../util/time");
const usernameUtils = require("../util/usernames");

module.exports = function(db, appConfig, ircConfig, nicknames) {

	const localMoment = function(arg) {
		return moment(arg).tz(appConfig.configValue("timeZone"));
	};

	const parseDbLine = function(line, callback) {
		var l = null;
		if (line) {
			l = _.clone(line);

			// Channel and server names

			if (l.channelName && l.serverName) {
				l.channel = channelUtils.getChannelUri(l.channelName, l.serverName);
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

					if (l.eventData) {
						l.events  = l.eventData.events;
						l.prevIds = l.eventData.prevIds;
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

	const getDateLineCountForChannel = function(channelUri, date, callback) {
		const serverName = channelUtils.channelServerNameFromUrl(channelUri);
		const channelName = channelUtils.channelNameFromUrl(channelUri);

		async.waterfall([
			(callback) => db.getChannelId(serverName, channelName, callback),
			(data, callback) => db.getDateLineCountForChannel(data.channelId, date, callback)
		], callback);
	};

	const getDateLinesForChannel = function(channelUri, date, options, callback) {
		const serverName = channelUtils.channelServerNameFromUrl(channelUri);
		const channelName = channelUtils.channelNameFromUrl(channelUri);

		async.waterfall([
			(callback) => db.getChannelId(serverName, channelName, callback),
			(data, callback) => db.getDateLinesForChannel(data.channelId, date, options, callback),
			(lines, callback) => parseDbLines(lines, callback)
		], callback);
	};

	const getDateLineCountForUsername = function(username, date, callback) {
		db.getDateLineCountForUsername(username, date, callback);
	};

	const getDateLinesForUsername = function(username, date, options, callback) {
		async.waterfall([
			(callback) => db.getDateLinesForUsername(username, date, options, callback),
			(lines, callback) => parseDbLines(lines, callback)
		], callback);
	};

	const getLineByLineId = function(lineId, callback) {
		async.waterfall([
			(callback) => db.getLineByLineId(lineId, callback),
			(line, callback) => parseDbLine(line, callback)
		], callback);
	};

	const getChannelLogDetails = function(channelUri, date, callback) {
		const today = timeUtils.ymd(localMoment());
		const yesterday = timeUtils.ymd(localMoment().subtract(1, "day"));

		const calls = [
			(callback) => getDateLineCountForChannel(channelUri, today, callback),
			(callback) => getDateLineCountForChannel(channelUri, yesterday, callback)
		];

		if (date && date !== today && date !== yesterday) {
			calls.push(
				(callback) => getDateLineCountForChannel(channelUri, date, callback)
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
		getUserLogDetails
	};
};
