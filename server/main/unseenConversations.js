const { getChannelUri } = require("../util/channels");

module.exports = function(io) {
	var unseenConversations = {};

	// Unseen conversations
	// These are grouped by users. You can only report an entire user's
	// private messages as unseen at the same time, but a user can have a
	// number of unseen private messages that can increase

	const reportUserAsSeen = function(serverName, username) {
		if (serverName && username) {
			delete unseenConversations[getChannelUri(serverName, username)];

			if (io) {
				io.emitUnseenConversations();
			}
		}
	};

	const addUnseenUser = function(serverName, username, userDisplayName, count = 1) {
		let uri = getChannelUri(serverName, username);
		let user = unseenConversations[uri];

		if (user) {
			user.count += count;
			user.userDisplayName = userDisplayName;
		}

		else {
			user = { count, serverName, username, userDisplayName };
			unseenConversations[uri] = user;
		}

		if (io) {
			io.emitUnseenConversations();
		}
	};

	const clearUnseenConversations = function() {
		unseenConversations = {};

		if (io) {
			io.emitUnseenConversations();
		}
	};

	return {
		addUnseenUser,
		clearUnseenConversations,
		reportUserAsSeen,
		unseenConversations: () => unseenConversations
	};
};
