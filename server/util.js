// PYRAMID
// Utilities module

const fs = require("fs");

const long = require("long");
const moment = require("moment-timezone");

const constants = require("./constants");

// Input string utilities

const normalise = function(s) {
	if (s && s.replace) {
		return s.replace(/\s+/g, " ");
	}

	return "";
};

const clean = function(s) {
	if (s && s.trim) {
		return normalise(s).trim();
	}

	return "";
};

const oneWord = function(s) {
	const cleanedString = clean(s);

	// Only return the first word in the string, for strings where space is not allowed
	if (cleanedString) {
		return cleanedString.replace(/\s.*$/, "");
	}

	return "";
};

const formatUriName = function(s) {
	const cleanedString = oneWord(s);

	// No slashes allowed, and all lowercase
	if (cleanedString) {
		return cleanedString.replace(/\//g, "").toLowerCase();
	}

	return "";
};

const lowerClean = function(s) {
	const cleanedString = clean(s);

	// All lowercase
	if (cleanedString) {
		return cleanedString.toLowerCase();
	}

	return "";
};

// Time utilities

const hms = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).format("HH:mm:ss");
};

const ymd = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).format("YYYY-MM-DD");
};

const ym = function(d){
	if (!d) { d = new Date(); }
	return moment(d).format("YYYY-MM");
};

const hmsPrefix = function(str, d){
	return "[" + hms(d) + "] " + str;
};

const ymdhmsPrefix = function(str, d){
	return "[" + ymd(d) + " " + hms(d) + "] " + str;
};

// File utilities

const copyFile = function(source, target, cb) {
	var cbCalled = false;

	var rd = fs.createReadStream(source);
	rd.on("error", function(err) {
		done(err);
	});
	var wr = fs.createWriteStream(target);
	wr.on("error", function(err) {
		done(err);
	});
	wr.on("close", function() {
		done();
	});
	rd.pipe(wr);

	function done(err) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}
};

// Channel URI utilities

const getChannelUri = function(channelName, serverName) {

	var safeString = function(str) {
		if (!str) {
			return "";
		}

		return str.replace(/[^a-zA-Z0-9_-]+/g, "");
	};

	var c = safeString(channelName);

	if (serverName) {
		return safeString(serverName) + "/" + c;
	}

	return c;
};

const channelNameFromUrl = function(url, prefix = "") {
	if (url && url.replace) {
		return url.replace(/^[^\/]+\//, prefix);
	}

	return null;
};

const channelServerNameFromUrl = function(url) {
	var m;
	if (url && url.match && (m = url.match(/^([^\/]+)\//)) && m[1]) {
		return m[1];
	}

	return null;
};

const channelUriFromNames = function(server, channel) {
	// TODO: Deprecate
	return getChannelUri(channel, server);
};

const passesChannelWhiteBlacklist = function(target, channelUri) {

	const segs = channelUri.toLowerCase().split("/");
	const server = segs[0], channel = segs[1];

	if (target) {

		// If there is a white list, and we're not on it, return false
		if (
			target.channelWhitelist &&
			target.channelWhitelist.length &&
			target.channelWhitelist.indexOf(channel) < 0
		) {
			return false;
		}

		// If we're on the blacklist, return false
		if (
			target.channelBlacklist &&
			target.channelBlacklist.indexOf(channel) >= 0
		) {
			return false;
		}

		// Same for servers

		if (
			target.serverWhitelist &&
			target.serverWhitelist.length &&
			target.serverWhitelist.indexOf(server) < 0
		) {
			return false;
		}

		if (
			target.serverBlacklist &&
			target.serverBlacklist.indexOf(server) >= 0
		) {
			return false;
		}
	}

	return true;
};

// Token utilities

var acceptedTokens = [];

const addToAcceptedTokens = function(token) {
	if (token) {
		acceptedTokens = [ ...acceptedTokens, token ];
	}
};

const isAnAcceptedToken = function(token) {
	return acceptedTokens.indexOf(token) >= 0;
};

const clearAcceptedTokens = function() {
	acceptedTokens = [];
};

const generateToken = function(length = 60) {
	const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var output = "";
	for(var i = 0; i < length; i++) {
		output += alpha[Math.round((alpha.length-1)*Math.random())];
	}
	return output;
};

const generateAcceptedToken = function(length = 60) {
	const token = generateToken(length);
	addToAcceptedTokens(token);
	return token;
};

// Relationship utilities

const getRelationship = function(username, friendsList) {

	if (username) {
		username = username.toLowerCase();

		const bestFriends = friendsList[constants.RELATIONSHIP_BEST_FRIEND] || [];
		const friends = friendsList[constants.RELATIONSHIP_FRIEND] || [];

		if (bestFriends.indexOf(username) >= 0) {
			return constants.RELATIONSHIP_BEST_FRIEND;
		}

		if (friends.indexOf(username) >= 0) {
			return constants.RELATIONSHIP_FRIEND;
		}
	}

	return constants.RELATIONSHIP_NONE;
};

// Event utilities

const isJoinEvent = function(event) {
	return event && event.type === "join";
};

const isPartEvent = function(event) {
	return event && constants.PART_EVENT_TYPES.indexOf(event.type) >= 0;
};

// Username utilities

const getUserColorNumber = function(username) {
	if (username) {
		username = username.toLowerCase();

		var hashedValue = new long(0);

		for (var i = 0; i < username.length; i++) {
			var c = username.charCodeAt(i);
			hashedValue = hashedValue.shiftLeft(6).add(hashedValue).add(c);
		}

		return hashedValue.mod(30).toNumber();
	}

	return null;
};

// API

module.exports = {

	// Strings
	normalise,
	clean,
	oneWord,
	formatUriName,
	lowerClean,

	// Time
	hms,
	ymd,
	ym,
	hmsPrefix,
	ymdhmsPrefix,

	// File
	copyFile,

	// Channel URL
	getChannelUri,
	channelNameFromUrl,
	channelServerNameFromUrl,
	channelUriFromNames,
	passesChannelWhiteBlacklist,

	// Token
	addToAcceptedTokens,
	isAnAcceptedToken,
	generateToken,
	generateAcceptedToken,
	clearAcceptedTokens,

	// Relationship
	getRelationship,

	// Event
	isJoinEvent,
	isPartEvent,

	// Username
	getUserColorNumber
};
