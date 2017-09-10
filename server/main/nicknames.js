const channelUtils = require("../util/channels");

module.exports = function(db, restriction) {

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
		isNicknamesLimitReached(function(reached) {
			if (reached) {
				callback(new Error("Nicknames limit reached"));
			}

			else {
				db.addNickname(nickname, callback);
			}
		});
	};

	const modifyNickname = function(nickname, data, callback) {
		db.modifyNickname(nickname, data, callback);
	};

	const removeNickname = function(nickname, callback) {
		db.removeNickname(nickname, callback);
	};

	const getHighlightStringsForMessage = function(message, channel, meUsername) {
		var highlightStrings = [];

		const meRegex = new RegExp("\\b" + meUsername + "\\b", "i");
		if (meRegex.test(message)) {
			highlightStrings.push(meUsername);
		}

		currentNicknames.forEach((nickname) => {
			const nickRegex = new RegExp("\\b" + nickname.nickname + "\\b", "i");
			if (
				nickRegex.test(message) &&
				channelUtils.passesChannelWhiteBlacklist(nickname, channel)
			) {
				highlightStrings.push(nickname.nickname);
			}
		});

		return highlightStrings;
	};

	const isNicknamesLimitReached = function(callback) {
		if (!restriction) {
			callback(false);
		}

		else {
			db.getNicknameCount(function(err, data) {
				let reached = data && data.count >= restriction.nicknamesLimit;
				callback(reached);
			});
		}
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
