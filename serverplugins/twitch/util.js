const ASTRAL_SYMBOLS_REGEX = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

var main;

const isTwitch = function(client) {
	if (client && client.config) {
		return isTwitchHostname(client.config.hostname);
	}

	return false;
};

const isTwitchHostname = function(hostname) {
	return /twitch\.tv$/.test(hostname);
};

const channelIsGroupChat = function(channelName) {
	return channelName && channelName[0] === "_";
};

const rangesOverlap = function (x1, x2, y1, y2) {
	var low1, low2, high1, high2;
	if (x1 <= y1) {
		low1 = x1;
		low2 = x2;
		high1 = y1;
		high2 = y2;
	}
	else {
		low1 = y1;
		low2 = y2;
		high1 = x1;
		high2 = x2;
	}

	return low1 <= high2 && high1 <= low2;
};

const stringWithoutAstralSymbols = function(str) {
	// Prevent index issues when astral symbols are involved in index-generating routine
	return str.replace(ASTRAL_SYMBOLS_REGEX, "_");
};

const getEnabledExternalEmoticonTypes = function(ffzEnabled, bttvEnabled) {
	const enabledTypes = [];

	if (ffzEnabled) {
		enabledTypes.push("ffz");
	}

	if (bttvEnabled) {
		enabledTypes.push("bttv");
	}

	return enabledTypes;
};

const acceptRequest = function(callback) {
	return function(error, response, data) {
		if (!error) {
			if (response && response.statusCode === 200) {
				callback(null, data);
			}
			else {
				error = new Error(`Response status code ${response.statusCode}`);
			}
		}

		if (error) {
			callback(error);
		}
	};
};

const log = function() {
	if (main && main.log) {
		main.log.apply(null, arguments);
	}
	else {
		console.log.apply(console, arguments);
	}
};

const warn = function() {
	if (main && main.warn) {
		main.warn.apply(null, arguments);
	}
	else {
		console.warn.apply(console, arguments);
	}
};

const setMain = function(_main) {
	main = _main;
};

module.exports = {
	acceptRequest,
	channelIsGroupChat,
	getEnabledExternalEmoticonTypes,
	isTwitch,
	isTwitchHostname,
	log,
	rangesOverlap,
	setMain,
	stringWithoutAstralSymbols,
	warn
};
