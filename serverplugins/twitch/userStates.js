const _ = require("lodash");

const twitchApiData = require("./twitchApiData");

var userStates = {};
var globalUserStates = {};

const getUserState = function(channel) {
	return userStates[channel];
};

const getGlobalUserState = function(serverName) {
	return globalUserStates[serverName];
};

const setUserState = function(channel, state) {
	userStates[channel] = state;
};

const setGlobalUserState = function(serverName, state) {
	globalUserStates[serverName] = state;
};

// Getting the "most average" user state for when the server lets us down...

const userStateSpecialness = function(state) {
	// (less is more average)

	let specialness = 0;

	// The less badges you have, the more average it must be, right?

	if (state && state.badges) {
		specialness = state.badges.length || 0;
	}

	return specialness;
};

const getAverageUserState = function() {
	let lowestValue, lowestState;

	_.forOwn(userStates, (state) => {
		if (state) {
			let specialness = userStateSpecialness(state);

			if (typeof lowestValue === "undefined" || lowestValue > specialness) {
				lowestValue = specialness;
				lowestState = state;
			}
		}
	});

	return lowestState;
};

const handleNewUserState = function(data) {
	let { channel, message, serverName } = data;
	let { command, tags } = message;

	if (command === "GLOBALUSERSTATE") {
		setGlobalUserState(serverName, tags);
	}
	else {
		setUserState(channel, tags);
	}

	if (tags["emote-sets"]) {
		twitchApiData.requestEmoticonImagesIfNeeded(
			tags["emote-sets"]
		);
	}
};

module.exports = {
	getAverageUserState,
	getGlobalUserState,
	getUserState,
	handleNewUserState,
	setGlobalUserState,
	setUserState
};
