const lodash    = require("lodash");

const constants = require("../constants");
const util      = require("../util");

module.exports = function(io, friends) {

	var channelUserLists = {};
	var currentOnlineFriends = [];

	const setChannelUserList = function(channelUri, userList) {
		if (channelUri) {
			channelUserLists[channelUri] = userList || {};
			reloadOnlineFriends();
		}
	};

	const addUserToUserList = function(
		channelUri, username, ident = "", hostname = "", modes = []
	) {
		if (!channelUserLists[channelUri]) {
			channelUserLists[channelUri] = {};
		}

		channelUserLists[channelUri][username] = {
			nick: username,
			ident,
			hostname,
			modes
		};
	};

	const updateUserInUserList = function(channelUri, username, data = {}) {
		if (!channelUserLists[channelUri]) {
			channelUserLists[channelUri] = {};
		}

		channelUserLists[channelUri][username] = lodash.assign(
			{},
			channelUserLists[channelUri][username] || {},
			data
		);
	};

	const deleteUserFromUserList = function(channelUri, username) {
		if (channelUserLists[channelUri]) {
			delete channelUserLists[channelUri][username];
		}
	};

	const getUserCurrentSymbol = function(channelUri, userName) {
		if (
			channelUri &&
			channelUserLists[channelUri] &&
			channelUserLists[channelUri][userName]
		) {
			return channelUserLists[channelUri][userName].symbol || "";
		}

		return "";
	};

	const reloadOnlineFriends = function() {
		const onlines = new Set();

		lodash.forOwn(channelUserLists, (list) => {
			// TODO: Vary friends by server at some point
			if (list) {
				const names = Object.keys(list);
				names.forEach((name) => {
					const relationship = util.getRelationship(
						name, friends.currentFriendsList()
					);
					if (relationship >= constants.RELATIONSHIP_FRIEND) {
						onlines.add(name.toLowerCase());
					}
				});
			}
		});

		const list = Array.from(onlines).sort();

		// Only apply if something changed

		if (
			list.length !== currentOnlineFriends.length ||
			!list.every((name, i) => name === currentOnlineFriends[i])
		) {
			currentOnlineFriends = list;

			if (io) {
				io.emitOnlineFriends();
			}
		}
	};

	return {
		addUserToUserList,
		channelUserLists: () => channelUserLists,
		currentOnlineFriends: () => currentOnlineFriends,
		deleteUserFromUserList,
		getChannelUserList: (channelUri) => channelUserLists[channelUri],
		getUserCurrentSymbol,
		reloadOnlineFriends,
		setChannelUserList,
		updateUserInUserList
	};
};
