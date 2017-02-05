// PYRAMID
// Utilities module

const moment = require("moment-timezone");

const config = require("../config");
const constants = require("./constants");

var allFriends = null;

// Time utilities

const hms = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).tz(config.timeZone).format("HH:mm:ss");
};

const ymd = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).tz(config.timeZone).format("YYYY-MM-DD")
};

const ym = function(d){
	if (!d) { d = new Date(); }
	return moment(d).tz(config.timeZone).format("YYYY-MM")
};

const hmsPrefix = function(str, d){
	return "[" + hms(d) + "] " + str;
};

const ymdhmsPrefix = function(str, d){
	return "[" + ymd(d) + " " + hms(d) + "] " + str;
};

// Channel URL utilities

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

const channelUrlFromNames = function(server, channel) {
	return server + "/" + channel.replace(/^#/, "");
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

const getRelationship = function(username) {
	username = username.toLowerCase();
	var relationship = constants.RELATIONSHIP_NONE;

	allFriends = allFriends || config.bestFriends.concat(config.friends);

	if (allFriends.indexOf(username) >= 0) {
		var isBestFriend = config.bestFriends.indexOf(username) >= 0;
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
	channelNameFromUrl,
	channelServerNameFromUrl,
	channelUrlFromNames,

	// Token
	addToAcceptedTokens,
	isAnAcceptedToken,
	generateToken,
	generateAcceptedToken,
	clearAcceptedTokens,

	// Relationship
	getRelationship
};
