// PYRAMID
// Logging module

const moment = require("moment-timezone");
const fs     = require("fs");
const mkdirp = require("mkdirp");
const path   = require("path");
const lazy   = require("lazy");
const async  = require("async");
const lodash = require("lodash");

const config = require("../config");
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

const standardWritingCallback = function(err){
	if (err) {
		throw err;
	}
};

const eventWithReasonLogRegExp = (descriptor) => {
	return new RegExp(
		"^\\*\\*\\s*" +
		USERNAME_SYMBOL_RGXSTR +
		"\\s+" +
		descriptor +
		"(\\s+\\(([^\\)]+)\\))?$"
	)
};

const eventWithReasonLogParser = (descriptor) => {
	return (line) => {
		var match = line.match(eventWithReasonLogRegExp(descriptor));
		if (match) {
			return {
				reason: match[3],
				symbol: match[1],
				username: match[2]
			};
		}

		return null;
	}
};

const modeEventLogParser = (symbol) => {
	return (line) => {
		var match = line.match(new RegExp(
			"^\\*\\*\\s*" +
			USERNAME_SYMBOL_RGXSTR +
			"\\s+" +
			"sets mode:\\s+" + symbol +
			"\\s*([^\\s]+)" +
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
					isAction: false,
					message: line.substr(match[0].length),
					symbol: match[1],
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
					isAction: true,
					message: line.substr(match[0].length),
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

	addMode: {
		build: (symbol, username, mode, argument) => {
			return `** ${symbol}${username} sets mode: +${mode}` +
				(argument ? " " + argument : "");
		},
		parse: modeEventLogParser("\\+")
	},

	removeMode: {
		build: (symbol, username, mode, argument) => {
			return `** ${symbol}${username} sets mode: -${mode}` +
				(argument ? " " + argument : "");
		},
		parse: modeEventLogParser("-")
	},

	kill: {
		build: (symbol, username, reason) => {
			return `** ${symbol}${username} was killed` +
				(reason ? " (" + reason + ")" : "");
		},
		parse: eventWithReasonLogParser("was killed")
	}
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

			case "+mode":
			case "-mode":
				const t = type === "+mode" ? "addMode" : "removeMode";
				return lineFormats[t].build(
					data.symbol, data.username, data.mode, data.argument
				);
		}
	}

	return "";
};

const channelPrefix = function(line, channelName) {
	return `[${channelName}] ${line}`;
};

var getLastLinesFromUser = function(username, options, done) {

	var limit = options.limit

	// Normal limit
	if(typeof limit != "number"){
		limit = 200
	}

	// Sanitizing input
	username = username.replace(/[^a-zA-Z0-9_-]+/g, "")

	// Log dir
	var logDir = path.join(LOG_ROOT, "_global", util.ym(options.d))

	fs.readFile(path.join(logDir, username.toLowerCase() + ".txt"), function(err, data){

		if(err){
			done(err)
			return
		}

		data = data.toString(config.encoding)

		var lines = data.split("\n")

		if(lines.length <= limit){
			done(null, data, lines.length-1)
		} else {
			done(null, lines.slice(-1*limit).join("\n"), lines.length-1)
		}
	})

}

var getLinesForFile = function(filePath, date, done) {
	fs.readFile(filePath, function(err, data) {

		if (err) {
			done(err);
			return;
		}

		data = data.toString(config.encoding);
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
	if(m = obj.message.match(/^\s*\[([^0-9:])([^\]]*)\]\s*/)){
		obj.to = m[1] + m[2]
		// Remove channel from content string
		obj.message = obj.message.substr(m[0].length)
		dirty = true;
	}

	// Extract time (if date not present)
	if(m = obj.message.match(/^\s*\[([0-9:]+)\]\s*/)){
		// Extract date from argument, if given
		var d = typeof date == "string" ? date + " " : ""
		// Add time as property
		obj.time = d + m[1]
		// Remove time from content string
		obj.message = obj.message.substr(m[0].length)
		dirty = true;
	}

	// Extract time (if date present)
	if(m = obj.message.match(/^\s*\[([0-9-]+) ([0-9:]+)\]\s*/)){
		// Add time as property
		obj.time = m[1] + " " + m[2]
		// Remove time from content string
		obj.message = obj.message.substr(m[0].length)
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

				obj = lodash.assign(obj, { type: type }, result);
				dirty = true;
				break;
			}
		}
	}

	if (!dirty) {
		return null;
	}

	return obj
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
}

var convertLogFileToLineObjects = function(data, date) {

	if (date && typeof date !== "string") {
		date = util.ymd(date);
	}

	var rawLines = data.split("\n");
	var lines = [];

	for(var i = 0; i < rawLines.length; i++){
		// Convert item to obj instead of str
		var line = parseLogLine(rawLines[i], date);
		addLineObjectToList(lines, line);
	}
	return lines
};

var statsFromFile = function(channel, month, logFileName, done){

	console.log("Checking out " + logFileName)

	// Gather the file path
	var filePath = path.join(LOG_ROOT, channel, month, logFileName.toLowerCase() + ".txt")

	// Only continue if this file exists
	fs.exists(filePath, function(exists){

		// Return if it doesn't exist
		if(!exists){
			done(null, null)
			return
		}

		// Extract date from log file name if applicable
		var fnDate = /^[0-9-]+$/.test(logFileName) ? logFileName : ""

		// The output
		var userCounts = {}

		// Let's do it!
		new lazy(fs.createReadStream(filePath))
			.lines
			.forEach(
				function(line){
					var l = parseLogLine(line.toString(config.encoding), fnDate)
					if(l.type == "msg"){

						var from = l.from.toLowerCase();
						if (config.nonPeople.indexOf(from) >= 0) {
							return;
						}

						if (!(from in userCounts)) {
							userCounts[from] = 0;
						}
						userCounts[from]++;
					}
				}
			)
			.on("pipe", function(){
				console.log("Got values for " + logFileName) //DEBUG

				// It ended!
				done(null, userCounts)
			})
	})
}

var statsFromFileWithArray = function(args, done){
	statsFromFile(args[0], args[1], args[2], done)
}

var statsFromDays = function(channel, firstDay, lastDay, done){

	var first = moment(firstDay)
	var now   = moment(lastDay)

	if(!first.isValid() || !now.isValid()){
		return false
	}

	// Preparing args for the methods
	var dayArgs = []
	while(now > firstDay){
		var ym = util.ym(now), ymd = util.ymd(now)
		dayArgs.push([channel, ym, ymd])
		now.subtract(1, "days")
	}

	// One big maddafackin' async call!
	async.map(dayArgs, statsFromFileWithArray, function(err, results){
		// Turn the results array into a dictionary so we have an idea what's what.
		var resultsDict = {}
		if(typeof results == "object" && results instanceof Array){
			for(var i = 0; i < results.length; i++){
				resultsDict[dayArgs[i][2]] = results[i]
			}
		}
		done(err, resultsDict)
	})
	return true
}

var statsFromLastDays = function(channel, dayAmount, done){
	if(typeof dayAmount != "number" || dayAmount <= 0){
		// Default: The last X days.
		dayAmount = 16
	}

	var today = moment()
	var firstDay = moment(today).subtract(dayAmount, "days")

	return statsFromDays(channel, firstDay, today, done)
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
	channelPath = channelPath.replace(/[^a-zA-Z0-9_\/-]+/g, "")
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
	} catch(e){}

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

	if (config.debug) {
		console.log(channelPrefix(line, channelName));
	}

	const dirName = path.join(constants.LOG_ROOT, channelUri, util.ym(d));

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
			{ encoding: config.encoding },
			callback
		)
	});
};

const writeLastSeen = function(fileName, data, callback = standardWritingCallback) {
	fs.writeFile(
		fileName,
		JSON.stringify(data),
		{ encoding: config.encoding },
		callback
	);
};

const writeLastSeenChannels = function(data, callback) {
	writeLastSeen(lastSeenChannelsFileName, data, callback);
};

const writeLastSeenUsers = function(data, callback) {
	writeLastSeen(lastSeenUsersFileName, data, callback);
};

module.exports = {
	getLastLinesFromUser,
	getChatroomLinesForDay,
	getUserLinesForMonth,
	parseLogLine,
	statsFromFile,
	statsFromLastDays,
	pathHasAnyLogs,
	pathHasLogsForDay,
	pathHasLogsForToday,
	pathHasLogsForYesterday,
	getChannelLogDetails,
	getUserLogDetails,
	getLogLineFromData,
	lineFormats,
	loadLastSeenInfo,
	loadLastSeenChannels,
	loadLastSeenUsers,
	logChannelLine,
	logCategoryLine,
	writeLastSeen,
	writeLastSeenChannels,
	writeLastSeenUsers
};
