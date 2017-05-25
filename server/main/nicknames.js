const channelUtils = require("../util/channels");

module.exports = function(db) {

	var currentNicknames = [];

	const getNicknames = function(callback) {
		db.getNicknames(callback);
	};

	const loadNicknames = function(callback) {
		getNicknames((err, data) => {
			if (err) {
				if (typeof callback === "function") {
					callback(err);
				}
			}
			else {
				currentNicknames = data;
				if (typeof callback === "function") {
					callback(null, data);
				}
			}
		});
	};

	const nicknamesDict = function(nicknames = currentNicknames) {
		const out = {};
		nicknames.forEach((nickname) => {
			out[nickname.nickname] = nickname;
		});

		return out;
	};

	const addNickname = function(nickname, callback) {
		db.addNickname(nickname, callback);
	};

	const modifyNickname = function(nickname, data, callback) {
		db.modifyNickname(nickname, data, callback);
	};

	const removeNickname = function(nickname, callback) {
		db.removeNickname(nickname, callback);
	};

	const getHighlightStringsForMessage = function(message, channelUri, meUsername) {
		var highlightStrings = [];

		const meRegex = new RegExp("\\b" + meUsername + "\\b", "i");
		if (meRegex.test(message)) {
			highlightStrings.push(meUsername);
		}

		currentNicknames.forEach((nickname) => {
			const nickRegex = new RegExp("\\b" + nickname.nickname + "\\b", "i");
			if (
				nickRegex.test(message) &&
				channelUtils.passesChannelWhiteBlacklist(nickname, channelUri)
			) {
				highlightStrings.push(nickname.nickname);
			}
		});

		return highlightStrings;
	};

	return {
		addNickname,
		currentNicknames: () => currentNicknames,
		getHighlightStringsForMessage,
		getNicknames,
		loadNicknames,
		modifyNickname,
		nicknamesDict,
		removeNickname
	};
};
