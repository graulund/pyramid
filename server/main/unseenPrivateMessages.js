const { getChannelUri } = require("../util/channels");

module.exports = function(io) {
	var unseenPrivateMessages = {};

	// Unseen private messages
	// These are grouped by users. You can only report an entire user's
	// private messages as unseen at the same time, but a user can have a
	// number of unseen private messages that can increase

	const reportUserAsSeen = function(serverName, username) {
		if (serverName && username) {
			delete unseenPrivateMessages[getChannelUri(serverName, username)];

			if (io) {
				io.emitUnseenPrivateMessages();
			}
		}
	};

	const addUnseenUser = function(serverName, username, count = 1) {
		let uri = getChannelUri(serverName, username);
		let user = unseenPrivateMessages[uri];

		if (user) {
			user.count += count;
		}

		else {
			user = { count, serverName, username };
			unseenPrivateMessages[uri] = user;
		}

		if (io) {
			io.emitUnseenPrivateMessages();
		}
	};

	const clearUnseenPrivateMessages = function() {
		unseenPrivateMessages = {};

		if (io) {
			io.emitUnseenPrivateMessages();
		}
	};

	return {
		addUnseenUser,
		clearUnseenPrivateMessages,
		reportUserAsSeen,
		unseenPrivateMessages: () => unseenPrivateMessages
	};
};
