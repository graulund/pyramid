const lodash    = require("lodash");

const constants = require("../constants");
const util      = require("../util");

module.exports = function(io, friends) {

	var channelUserLists = {};
	var currentOnlineFriends = [];

	const setChannelUserList = function(channelUri, userList, ircClient) {
		if (channelUri) {
			channelUserLists[channelUri] = lodash.mapValues(
				userList || {},
				(user) => addUserSymbol(user, ircClient)
			);
			reloadOnlineFriends();
		}
	};

	const addUserToUserList = function(
		channelUri, username, ident = "", hostname = "", modes = [], ircClient = null
	) {
		if (!channelUserLists[channelUri]) {
			channelUserLists[channelUri] = {};
		}

		channelUserLists[channelUri][username] = addUserSymbol({
			nick: username,
			ident,
			hostname,
			modes
		}, ircClient);
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

	const changeNickInUserList = function(channelUri, prevName, newName) {
		if (
			channelUserLists[channelUri] &&
			channelUserLists[channelUri][prevName]
		) {
			channelUserLists[channelUri][newName] = channelUserLists[channelUri][prevName];
			delete channelUserLists[channelUri][prevName];
		}
	};

	const addModesInUserList = function(channelUri, username, modes, ircClient) {
		if (channelUserLists[channelUri] && modes) {
			if (!(modes instanceof Array)) {
				modes = [modes];
			}

			let userData = channelUserLists[channelUri][username];

			if (userData) {
				let newModes = (userData.modes || []).concat(modes);
				updateUserInUserList(channelUri, username, {
					modes: newModes,
					symbol: userSymbol(newModes, ircClient)
				});
			}
		}
	};

	const removeModesFromUserList = function(channelUri, username, modes, ircClient) {
		if (channelUserLists[channelUri] && modes) {
			if (!(modes instanceof Array)) {
				modes = [modes];
			}

			let userData = channelUserLists[channelUri][username];

			if (userData) {
				let { modes: userModes } = userData;

				if (userModes && userModes.length) {
					let newModes = lodash.without(userModes, ...modes);
					updateUserInUserList(channelUri, username, {
						modes: newModes,
						symbol: userSymbol(newModes, ircClient)
					});
				}
			}
		}
	};

	const deleteUserFromUserList = function(channelUri, username) {
		if (channelUserLists[channelUri]) {
			delete channelUserLists[channelUri][username];
		}
	};

	const deleteUserFromAllUserLists = function(serverName, username) {
		let channels = [];

		Object.keys(channelUserLists).forEach((channelUri) => {
			let sName = util.channelServerNameFromUrl(channelUri);
			if (
				sName === serverName &&
				channelUserLists[channelUri][username]
			) {
				delete channelUserLists[channelUri][username];
				channels.push(channelUri);
			}
		});

		return channels;
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

	const userSymbol = function(modes, ircClient) {
		if (modes && modes.length && ircClient) {
			let netPrefixes = ircClient.network.options.PREFIX;
			let prefix = lodash.find(netPrefixes, { mode: modes[0] });
			if (prefix) {
				return prefix.symbol;
			}
		}

		return "";
	};

	const addUserSymbol = function(user, ircClient) {
		return lodash.assign(user, { symbol: userSymbol(user.modes, ircClient) });
	};

	return {
		addModesInUserList,
		addUserToUserList,
		changeNickInUserList,
		channelUserLists: () => channelUserLists,
		currentOnlineFriends: () => currentOnlineFriends,
		deleteUserFromAllUserLists,
		deleteUserFromUserList,
		getChannelUserList: (channelUri) => channelUserLists[channelUri],
		getUserCurrentSymbol,
		reloadOnlineFriends,
		removeModesFromUserList,
		setChannelUserList,
		updateUserInUserList
	};
};
