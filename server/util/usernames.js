const long = require("long");

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

module.exports = {
	getUserColorNumber
};
