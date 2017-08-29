// PYRAMID
// Logging module

const fs = require("fs");
const path = require("path");

const getFolderSize = require("get-folder-size");
const mkdirp = require("mkdirp");

const constants = require("./constants");
const channelUtils = require("./util/channels");
const pathUtils = require("./util/paths");
const timeUtils = require("./util/time");

const pathChannelUri = function(channelUri) {
	const uriData = channelUtils.parseChannelUri(channelUri);

	if (!uriData) {
		return "unknown";
	}

	const { channel, channelType, server } = uriData;
	var dirs;

	if (channelType === constants.CHANNEL_TYPES.PRIVATE) {
		dirs = [server, "private", channel];
	}

	else {
		dirs = [server, channel];
	}

	return path.join(...dirs);
};

const standardWritingCallback = function(err) {
	if (err) {
		console.warn("Error occurred writing to file:", err);
	}
};

const lineFormats = {
	msg: {
		build: (symbol, username, message) => {
			return `<${symbol}${username}> ${message}`;
		}
	},

	action: {
		build: (symbol, username, message) => {
			return `* ${symbol}${username} ${message}`;
		}
	},

	notice: {
		build: (symbol, username, message) => {
			username = username || "notice";
			return `-${symbol}${username}- ${message}`;
		}
	},

	join: {
		build: (symbol, username) => {
			return `** ${symbol}${username} joined`;
		}
	},

	part: {
		build: (symbol, username, reason) => {
			return `** ${symbol}${username} left` +
				(reason ? " (" + reason + ")" : "");
		}
	},

	quit: {
		build: (symbol, username, reason) => {
			return `** ${symbol}${username} quit` +
				(reason ? " (" + reason + ")" : "");
		}
	},

	kick: {
		build: (symbol, username, by, reason) => {
			return `** ${symbol}${username} was kicked by ${by}` +
				(reason ? " (" + reason + ")" : "");
		}
	},

	mode: {
		build: (symbol, username, mode, argument) => {
			return `** ${symbol}${username} sets mode: ${mode}` +
				(argument ? " " + argument : "");
		}
	},

	kill: {
		build: (symbol, username, reason) => {
			return `** ${symbol}${username} was killed` +
				(reason ? " (" + reason + ")" : "");
		}
	},

	connectionEvent: {
		build: (status, server) => {
			var by = "by";
			if (status === "connected") { by = "to"; }
			if (status === "disconnected") { by = "from"; }
			if (status === "failed") { by = "to connect to"; }
			if (status === "aborted") { by = "connecting to"; }

			return `*** ${status} ${by} ${server}`;
		}
	},
};

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

const channelPrefix = function(line, channel) {
	let channelName = channelUtils.channelNameFromUri(channel, "#");
	return `[${channelName}] ${line}`;
};

// Logging

const logChannelLine = function(channel, line, d) {
	line = timeUtils.hmsPrefix(line, d);

	let logsRoot = pathUtils.getLogsRoot();
	let dirName = path.join(
		logsRoot, pathChannelUri(channel), timeUtils.ym(d)
	);

	logLine(line, dirName, timeUtils.ymd(d));
};

const logCategoryLine = function(categoryName, channel, line, d) {
	line = timeUtils.ymdhmsPrefix(line, d);
	line = channelPrefix(line, channel);

	let logsRoot = pathUtils.getLogsRoot();
	let dirName = path.join(logsRoot, "_global", timeUtils.ym(d));

	logLine(line, dirName, categoryName);
};

const logLine = function(line, dirName, fileName, callback = standardWritingCallback) {
	mkdirp(dirName, function(err) {
		if (err) {
			console.warn(`Could not create directory ${dirName}:`, err);
		}

		else {
			fs.appendFile(
				path.join(dirName, fileName + ".txt"),
				line + "\n",
				{ encoding: constants.FILE_ENCODING },
				callback
			);
		}
	});
};

// System info

const getDatabaseSize = function(callback) {
	let dbFilename = pathUtils.getDatabaseFilename();
	return fs.stat(dbFilename, (err, stats) => {
		callback(err, stats && stats.size);
	});
};

const getLogFolderSize = function(callback) {
	let logsRoot = pathUtils.getLogsRoot();
	return getFolderSize(logsRoot, callback);
};

module.exports = {
	getDatabaseSize,
	getLogFolderSize,
	getLogLineFromData,
	lineFormats,
	logCategoryLine,
	logChannelLine
};
