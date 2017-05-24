// PYRAMID
// Logging module

const fs = require("fs");
const path = require("path");

const _ = require("lodash");
const getFolderSize = require("get-folder-size");
const mkdirp = require("mkdirp");
const moment = require("moment-timezone");

const constants = require("./constants");
const util = require("./util");

const LOG_ROOT = constants.LOG_ROOT;

const USERNAME_SYMBOL_RGXSTR = "([@\\+%!\\.]*)([A-Za-z0-9|\\[\\]{}\\\\_-]+)";

const lastSeenChannelsFileName = path.join(
	__dirname, "..", "data", "lastSeenChannels.json"
);
const lastSeenUsersFileName = path.join(
	__dirname, "..", "data", "lastSeenUsers.json"
);

const pathChannelUri = function(channelUri) {
	return channelUri.replace(/\//g, path.sep);
};

const standardWritingCallback = function(err) {
	if (err) {
		throw err;
	}
};

const eventWithReasonLogRegExp = function(descriptor) {
	return new RegExp(
		"^\\*\\*\\s*" +
		USERNAME_SYMBOL_RGXSTR +
		"\\s+" +
		descriptor +
		"(\\s+\\(([^\\)]+)\\))?$"
	);
};

const eventWithReasonLogParser = function(descriptor) {
	return function(line) {
		var match = line.match(eventWithReasonLogRegExp(descriptor));
		if (match) {
			return {
				reason: match[3],
				symbol: match[1],
				username: match[2]
			};
		}

		return null;
	};
};

const lineFormats = {
	msg: {
		build: (symbol, username, message) => {
			return `<${symbol}${username}> ${message}`;
		},
		parse: (line) => {
			var match = line.match(new RegExp(`^<${USERNAME_SYMBOL_RGXSTR}>\s*`));
			if (match) {
				return {
					message: line.substr(match[0].length),
					symbol: match[1],
					type: "msg",
					username: match[2]
				};
			}

			return null;
		}
	},

	action: {
		build: (symbol, username, message) => {
			return `* ${symbol}${username} ${message}`;
		},
		parse: (line) => {
			var match = line.match(/^\*\s*([^\s\*]+)\s+/);
			if (match) {
				return {
					message: line.substr(match[0].length),
					type: "action",
					username: match[1]
				};
			}

			return null;
		}
	},

	notice: {
		build: (symbol, username, message) => {
			username = username || "notice";
			return `-${symbol}${username}- ${message}`;
		},
		parse: (line) => {
			var match = line.match(new RegExp(`^-${USERNAME_SYMBOL_RGXSTR}-\s*`));
			if (match) {
				return {
					message: line.substr(match[0].length),
					type: "notice",
					username: match[1]
				};
			}

			return null;
		}
	},

	join: {
		build: (symbol, username) => {
			return `** ${symbol}${username} joined`;
		},
		parse: (line) => {
			var match = line.match(/^\*\*\s*([^\s\*]+)\s+joined$/);
			if (match) {
				return {
					username: match[1]
				};
			}

			return null;
		}
	},

	part: {
		build: (symbol, username, reason) => {
			return `** ${symbol}${username} left` +
				(reason ? " (" + reason + ")" : "");
		},
		parse: eventWithReasonLogParser("left")
	},

	quit: {
		build: (symbol, username, reason) => {
			return `** ${symbol}${username} quit` +
				(reason ? " (" + reason + ")" : "");
		},
		parse: eventWithReasonLogParser("quit")
	},

	kick: {
		build: (symbol, username, by, reason) => {
			return `** ${symbol}${username} was kicked by ${by}` +
				(reason ? " (" + reason + ")" : "");
		},
		parse: (line) => {
			var match = line.match(
				new RegExp(
					"^\\*\\*\\s*" +
					USERNAME_SYMBOL_RGXSTR +
					"\\s+" +
					"was kicked by" +
					"\\s+" +
					"([^\\s]+)" +
					"(\\s+\\(([^\\)]+)\\))?$"
				)
			);
			if (match) {
				return {
					by: match[3],
					reason: match[4],
					symbol: match[1],
					username: match[2]
				};
			}

			return null;
		}
	},

	mode: {
		build: (symbol, username, mode, argument) => {
			return `** ${symbol}${username} sets mode: ${mode}` +
				(argument ? " " + argument : "");
		},
		parse: (line) => {
			var match = line.match(new RegExp(
				"^\\*\\*\\s*" +
				USERNAME_SYMBOL_RGXSTR +
				"\\s+" +
				"sets mode:\\s+([^\\s]+)" +
				"(\\s+(.+))?$"
			));
			if (match) {
				return {
					argument: match[4],
					mode: match[3],
					symbol: match[1],
					username: match[2]
				};
			}

			return null;
		}
	},

	kill: {
		build: (symbol, username, reason) => {
			return `** ${symbol}${username} was killed` +
				(reason ? " (" + reason + ")" : "");
		},
		parse: eventWithReasonLogParser("was killed")
	},

	connectionEvent: {
		build: (status, server) => {
			var by = "by";
			if (status === "connected") { by = "to"; }
			if (status === "disconnected") { by = "from"; }

			return `*** ${status} ${by} ${server}`;
		},
		parse: (line) => {
			var match = line.match(/^\*\*\*\s*([^\s\*]+)\s+(by|to|from)\s+([^\s\*]+)$/);
			if (match) {
				return {
					status: match[1],
					server: match[3]
				};
			}

			return null;
		}
	},
};

const lineTypes = Object.keys(lineFormats);

const getLogLineFromData = function(type, data) {
	if (type && data) {
		switch (type) {
			case "msg":
			case "action":
				return lineFormats[type].build(
					data.symbol, data.username, data.message
				);

			case "join":
				return lineFormats.join.build(
					data.symbol, data.username
				);

			case "part":
			case "quit":
			case "kill":
				return lineFormats[type].build(
					data.symbol, data.username, data.reason
				);

			case "kick":
				return lineFormats.kick.build(
					data.symbol, data.username, data.by, data.reason
				);

			case "mode":
				return lineFormats.mode.build(
					data.symbol, data.username, data.mode, data.argument
				);

			case "connectionEvent":
				return lineFormats.connectionEvent.build(
					data.status, data.server
				);
		}
	}

	return "";
};

const channelPrefix = function(line, channelName) {
	return `[${channelName}] ${line}`;
};

var getLastLinesFromUser = function(username, options, done) {

	var limit = options.limit;

	// Normal limit
	if (typeof limit != "number") {
		limit = 200;
	}

	// Sanitizing input
	username = username.replace(/[^a-zA-Z0-9_-]+/g, "");

	// Log dir
	var logDir = path.join(LOG_ROOT, "_global", util.ym(options.d));

	fs.readFile(path.join(logDir, username.toLowerCase() + ".txt"), function(err, data) {

		if (err) {
			done(err);
			return;
		}

		data = data.toString(constants.FILE_ENCODING);

		var lines = data.split("\n");

		if (lines.length <= limit) {
			done(null, data, lines.length-1);
		} else {
			done(null, lines.slice(-1*limit).join("\n"), lines.length-1);
		}
	});
};

var getLinesForFile = function(filePath, date, done) {
	fs.readFile(filePath, function(err, data) {

		if (err) {
			done(err);
			return;
		}

		data = data.toString(constants.FILE_ENCODING);
		const lines = convertLogFileToLineObjects(data, date);
		done(null, lines);
	});
};

var getChatroomLinesForDay = function(server, channel, date, done) {

	// Sanitizing input
	server = server.replace(/[^a-zA-Z0-9_-]+/g, "");
	channel = channel.replace(/[^a-zA-Z0-9_-]+/g, "");

	// Log dir
	var logDir = path.join(LOG_ROOT, server, channel, util.ym(date));

	return getLinesForFile(path.join(logDir, util.ymd(date) + ".txt"), date, done);
};

var getUserLinesForMonth = function(userName, date, done) {
	return getLinesForFile(path.join(LOG_ROOT, userMonthPath(userName, date)), null, done);
};

var parseLogLine = function(line, date) {
	// Convert item to obj instead of str
	var m, obj = {
		type: "msg",
		time: null,
		from: null,
		to: null,
		message: line,
		isAction: false
	};

	var dirty = false;

	// Extract channel identifier (if present)
	m = obj.message.match(/^\s*\[([^0-9:])([^\]]*)\]\s*/);

	if (m) {
		obj.to = m[1] + m[2];
		// Remove channel from content string
		obj.message = obj.message.substr(m[0].length);
		dirty = true;
	}

	// Extract time (if date not present)
	m = obj.message.match(/^\s*\[([0-9:]+)\]\s*/);

	if (m) {
		// Extract date from argument, if given
		var d = typeof date == "string" ? date + " " : "";
		// Add time as property
		obj.time = d + m[1];
		// Remove time from content string
		obj.message = obj.message.substr(m[0].length);
		dirty = true;
	}

	// Extract time (if date present)
	m = obj.message.match(/^\s*\[([0-9-]+) ([0-9:]+)\]\s*/);

	if (m) {
		// Add time as property
		obj.time = m[1] + " " + m[2];
		// Remove time from content string
		obj.message = obj.message.substr(m[0].length);
		dirty = true;
	}

	// Extract contents
	const innerLine = obj.message.trim();
	for (var i = 0; i < lineTypes.length; i++) {
		var type = lineTypes[i];
		if (lineFormats[type]) {
			const result = lineFormats[type].parse(innerLine);

			if (result) {
				if (type === "addMode") {
					type = "+mode";
				}
				else if (type === "removeMode") {
					type = "-mode";
				}

				obj = _.assign(obj, { type: type }, result);
				dirty = true;
				break;
			}
		}
	}

	if (!dirty) {
		return null;
	}

	return obj;
};

var addLineObjectToList = function(linesList, data) {
	if (data) {
		// TODO: Should be main logic?
		if (constants.BUNCHABLE_EVENT_TYPES.indexOf(data.type) >= 0) {
			const lastIndex = linesList.length-1;
			const lastItem = linesList[lastIndex];
			if (lastItem) {
				if (constants.BUNCHABLE_EVENT_TYPES.indexOf(lastItem.type) >= 0) {
					// Create bunch and insert in place
					linesList[lastIndex] = {
						events: [lastItem, data],
						time: data.time,
						type: "events"
					};
					return;
				}
				else if (lastItem.type === "events") {
					// Add to bunch, resulting in a new, inserted in place
					linesList[lastIndex] = {
						events: lastItem.events.concat([data]),
						time: data.time,
						type: "events"
					};
					return;
				}
			}
		}

		linesList.push(data);
	}
};

var convertLogFileToLineObjects = function(data, date) {

	if (date && typeof date !== "string") {
		date = util.ymd(date);
	}

	var rawLines = data.split("\n");
	var lines = [];

	for (var i = 0; i < rawLines.length; i++) {
		// Convert item to obj instead of str
		var line = parseLogLine(rawLines[i], date);
		addLineObjectToList(lines, line);
	}

	return lines;
};

const pathHasAnyLogs = function(channelPath) {
	try {
		// Throws on fail, does nothing otherwise
		fs.accessSync(path.join(LOG_ROOT, channelPath), fs.constants.R_OK);
		return true;
	} catch(e) {
		return false;
	}
};

const pathHasLogsForDay = function(channelPath, d) {
	channelPath = channelPath.replace(/[^a-zA-Z0-9_\/-]+/g, "");
	return pathHasAnyLogs(path.join(
		channelPath, util.ym(d), util.ymd(d) + ".txt"
	));
};

const userNameHasLogsForMonth = function(userName, d) {
	return pathHasAnyLogs(userMonthPath(userName, d));
};

const pathHasLogsForToday = function(channelPath) {
	return pathHasLogsForDay(channelPath, moment());
};

const pathHasLogsForYesterday = function(channelPath) {
	return pathHasLogsForDay(channelPath, moment().subtract(1, "day"));
};

const userMonthPath = function(userName, d) {
	userName = userName.replace(/[^a-zA-Z0-9_-]+/g, "");
	return path.join(
		"_global", util.ym(d), userName + ".txt"
	);
};

const getChannelLogDetails = function(channel) {
	const today = util.ymd(moment());
	const yesterday = util.ymd(moment().subtract(1, "day"));

	return {
		[today]: pathHasLogsForToday(channel),
		[yesterday]: pathHasLogsForYesterday(channel)
	};
};

const getUserLogDetails = function(userName) {
	const today = util.ym(moment());
	return {
		[today]: userNameHasLogsForMonth(userName, moment())
	};
};

// Load last seen info

const loadLastSeenInfo = function(fileName) {
	var json = "";
	try {
		json = fs.readFileSync(fileName);
	} catch(err) {
		// Create empty file
		const dirName = path.dirname(fileName);
		mkdirp(dirName, function(err) {
			if (err) {
				throw err;
			}
			var fd = fs.openSync(fileName, "w");
			fs.closeSync(fd);
		});
	}

	var output = {};
	try {
		output = JSON.parse(json);
	} catch(e) {
		// Not in JSON format, abort
	}

	return output || {};
};

const loadLastSeenChannels = function() {
	return loadLastSeenInfo(lastSeenChannelsFileName);
};

const loadLastSeenUsers = function() {
	return loadLastSeenInfo(lastSeenUsersFileName);
};

// Logging

const logChannelLine = function(channelUri, channelName, line, d) {
	line = util.hmsPrefix(line, d);

	if (constants.DEBUG) {
		console.log(channelPrefix(line, channelName));
	}

	const dirName = path.join(
		constants.LOG_ROOT, pathChannelUri(channelUri), util.ym(d)
	);

	logLine(line, dirName, util.ymd(d));
};

const logCategoryLine = function(categoryName, channelUri, channelName, line, d) {
	line = util.ymdhmsPrefix(line, d);
	line = channelPrefix(line, channelName);

	const dirName = path.join(constants.LOG_ROOT, "_global", util.ym(d));

	logLine(line, dirName, categoryName);
};

const logLine = function(line, dirName, fileName, callback = standardWritingCallback) {
	mkdirp(dirName, function(err) {
		if (err) {
			throw err;
		}
		fs.appendFile(
			path.join(dirName, fileName + ".txt"),
			line + "\n",
			{ encoding: constants.FILE_ENCODING },
			callback
		);
	});
};

const writeLastSeen = function(fileName, data, callback = standardWritingCallback) {
	fs.writeFile(
		fileName,
		JSON.stringify(data),
		{ encoding: constants.FILE_ENCODING },
		callback
	);
};

const writeLastSeenChannels = function(data, callback) {
	writeLastSeen(lastSeenChannelsFileName, data, callback);
};

const writeLastSeenUsers = function(data, callback) {
	writeLastSeen(lastSeenUsersFileName, data, callback);
};

// System info

const getDatabaseSize = function(callback) {
	return getFolderSize(constants.DATA_ROOT, callback);
};

const getLogFolderSize = function(callback) {
	return getFolderSize(constants.LOG_ROOT, callback);
};

module.exports = {
	getChannelLogDetails,
	getChatroomLinesForDay,
	getDatabaseSize,
	getLastLinesFromUser,
	getLogFolderSize,
	getLogLineFromData,
	getUserLinesForMonth,
	getUserLogDetails,
	lineFormats,
	loadLastSeenChannels,
	loadLastSeenInfo,
	loadLastSeenUsers,
	logCategoryLine,
	logChannelLine,
	parseLogLine,
	pathHasAnyLogs,
	pathHasLogsForDay,
	pathHasLogsForToday,
	pathHasLogsForYesterday,
	writeLastSeen,
	writeLastSeenChannels,
	writeLastSeenUsers
};
