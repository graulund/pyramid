// PYRAMID
// Utilities module

const path = require("path");
const moment = require("moment-timezone");

const constants = require("./constants");

var allFriends = null;

// Time utilities

const hms = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).format("HH:mm:ss");
};

const ymd = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).format("YYYY-MM-DD")
};

const ym = function(d){
	if (!d) { d = new Date(); }
	return moment(d).format("YYYY-MM")
};

const hmsPrefix = function(str, d){
	return "[" + hms(d) + "] " + str;
};

const ymdhmsPrefix = function(str, d){
	return "[" + ymd(d) + " " + hms(d) + "] " + str;
};

// Channel URI utilities

const getChannelUri = function(channelName, serverName) {

	var safeString = function(str) {
		if (!str) {
			return "";
		}

		return str.replace(/[^a-zA-Z0-9_-]+/g, "");
	}

	var c = safeString(channelName);

	if (serverName) {
		return path.join(safeString(serverName), c);
	}

	return c;
};

const channelNameFromUrl = function(url) {
	if (url && url.replace) {
		return url.replace(/^[^\/]+\//, "#");
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

const passesChannelWhiteBlacklist = function(target, query) {
	if (target) {

		// If there is a white list, and we're not on it, return false
		if (
			target.channelWhitelist &&
			target.channelWhitelist.length &&
			target.channelWhitelist.indexOf(query) < 0
		) {
			return false;
		}

		// If we're on the blacklist, return false
		if (
			target.channelBlacklist &&
			target.channelBlacklist.indexOf(query) >= 0
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
	username = username.toLowerCase();
	var relationship = constants.RELATIONSHIP_NONE;

	const bestFriends = friendsList[constants.RELATIONSHIP_BEST_FRIEND] || [];
	const friends = friendsList[constants.RELATIONSHIP_FRIEND] || [];

	allFriends = allFriends || bestFriends.concat(friends);

	if (allFriends.indexOf(username) >= 0) {
		var isBestFriend = bestFriends.indexOf(username) >= 0;
		relationship = isBestFriend
			? constants.RELATIONSHIP_BEST_FRIEND
			: constants.RELATIONSHIP_FRIEND;
	}

	return relationship;
};

// API

module.exports = {

	// Time
	hms,
	ymd,
	ym,
	hmsPrefix,
	ymdhmsPrefix,

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
	getRelationship
};
