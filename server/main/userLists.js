const _ = require("lodash");

const constants = require("../constants");
const channelUtils = require("../util/channels");
const relationshipUtils = require("../util/relationships");

module.exports = function(io, friends) {

	var channelUserLists = {};
	var currentOnlineFriends = [];

	const setChannelUserList = function(channel, userList, ircClient) {
		if (channel) {
			channelUserLists[channel] = _.mapValues(
				userList || {},
				(user) => addUserSymbol(user, ircClient)
			);
			reloadOnlineFriends();
		}
	};

	const addUserToUserList = function(
		channel, username, ident = "", hostname = "", modes = [], ircClient = null
	) {
		if (!channelUserLists[channel]) {
			channelUserLists[channel] = {};
		}

		channelUserLists[channel][username] = addUserSymbol({
			nick: username,
			ident,
			hostname,
			modes
		}, ircClient);
	};

	const updateUserInUserList = function(channel, username, data = {}) {
		if (!channelUserLists[channel]) {
			channelUserLists[channel] = {};
		}

		channelUserLists[channel][username] = _.assign(
			{},
			channelUserLists[channel][username] || {},
			data
		);
	};

	const changeNickInUserList = function(channel, prevName, newName) {
		if (
			channelUserLists[channel] &&
			channelUserLists[channel][prevName]
		) {
			channelUserLists[channel][newName] = channelUserLists[channel][prevName];
			delete channelUserLists[channel][prevName];
		}
	};

	const addModesInUserList = function(channel, username, modes, ircClient) {
		if (channelUserLists[channel] && modes) {
			if (!(modes instanceof Array)) {
				modes = [modes];
			}

			let userData = channelUserLists[channel][username];

			if (userData) {
				let newModes = (userData.modes || []).concat(modes);
				updateUserInUserList(channel, username, {
					modes: newModes,
					symbol: userSymbol(newModes, ircClient)
				});
			}
		}
	};

	const removeModesFromUserList = function(channel, username, modes, ircClient) {
		if (channelUserLists[channel] && modes) {
			if (!(modes instanceof Array)) {
				modes = [modes];
			}

			let userData = channelUserLists[channel][username];

			if (userData) {
				let { modes: userModes } = userData;

				if (userModes && userModes.length) {
					let newModes = _.without(userModes, ...modes);
					updateUserInUserList(channel, username, {
						modes: newModes,
						symbol: userSymbol(newModes, ircClient)
					});
				}
			}
		}
	};

	const deleteUserFromUserList = function(channel, username) {
		if (channelUserLists[channel]) {
			delete channelUserLists[channel][username];
		}
	};

	const deleteUserFromAllUserLists = function(serverName, username) {
		let channels = [];

		Object.keys(channelUserLists).forEach((channel) => {
			let sName = channelUtils.serverNameFromChannelUri(channel);
			if (
				sName === serverName &&
				channelUserLists[channel][username]
			) {
				delete channelUserLists[channel][username];
				channels.push(channel);
			}
		});

		return channels;
	};

	const getUserCurrentSymbol = function(channel, username) {
		if (
			channel &&
			channelUserLists[channel] &&
			channelUserLists[channel][username]
		) {
			return channelUserLists[channel][username].symbol || "";
		}

		return "";
	};

	const reloadOnlineFriends = function() {
		const onlines = new Set();

		_.forOwn(channelUserLists, (list) => {
			// TODO: Vary friends by server at some point
			if (list) {
				const names = Object.keys(list);
				names.forEach((name) => {
					const relationship = relationshipUtils.getRelationship(
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
			let prefix = _.find(netPrefixes, { mode: modes[0] });
			if (prefix) {
				return prefix.symbol;
			}
		}

		return "";
	};

	const addUserSymbol = function(user, ircClient) {
		return _.assign(user, { symbol: userSymbol(user.modes, ircClient) });
	};

	return {
		addModesInUserList,
		addUserToUserList,
		changeNickInUserList,
		channelUserLists: () => channelUserLists,
		currentOnlineFriends: () => currentOnlineFriends,
		deleteUserFromAllUserLists,
		deleteUserFromUserList,
		getChannelUserList: (channel) => channelUserLists[channel],
		getUserCurrentSymbol,
		reloadOnlineFriends,
		removeModesFromUserList,
		setChannelUserList,
		updateUserInUserList
	};
};
