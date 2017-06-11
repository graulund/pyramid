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
	for (var i = 0; i < length; i++) {
		output += alpha[Math.round((alpha.length-1)*Math.random())];
	}
	return output;
};

const generateAcceptedToken = function(length = 60) {
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
