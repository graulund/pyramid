const sodium = require("sodium").api;

const SESSION_KEY_LENGTH = 80;
const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

var acceptedTokens = [];

const rand = function() {
	return sodium.randombytes_random() / 0xffffffff;
};

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

const generateToken = function(length = SESSION_KEY_LENGTH) {
	var out = "";

	for (var i = 0; i < length; i++) {
		out += CHARS[Math.round(rand() * (CHARS.length - 1))];
	}

	return out;
};

const generateAcceptedToken = function(length = SESSION_KEY_LENGTH) {
	const token = generateToken(length);
	addToAcceptedTokens(token);
	return token;
};

module.exports = {
	addToAcceptedTokens,
	clearAcceptedTokens,
	generateAcceptedToken,
	generateToken,
	isAnAcceptedToken
};
