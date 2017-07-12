const _ = require("lodash");

const constants = require("../constants");
const log = require("../log");
const channelUtils = require("../util/channels");
const relationshipUtils = require("../util/relationships");
const stringUtils = require("../util/strings");

module.exports = function(
	io,
	appConfig,
	ircConfig,
	nicknames,
	userLists,
	lastSeen,
	messageCaches,
	friends,
	ircConnectionState
) {

	const userListEmissionMethods = {};

	const handleIncomingMessageEvent = function(
		channelUri, serverName, username,
		time, type, message, tags, meUsername,
		logLine, isSeenActivity = true, messageToken = null,
		customCols = null
	) {
		const symbol = userLists.getUserCurrentSymbol(channelUri, username);

		// Log

		if (logLine) {
			if (appConfig.configValue("logLinesFile")) {
				log.logChannelLine(channelUri, logLine, time);
			}
			else if (appConfig.configValue("debug")) {
				let channelName = channelUtils.channelNameFromUri(channelUri, "#");
				console.log(`[${channelName}] ${logLine}`);
			}
		}

		// Is this from a person among our friends? Note down "last seen" time.

		var relationship = null;

		if (isSeenActivity) {
			relationship = relationshipUtils.getRelationship(
				username, friends.currentFriendsList()
			);

			if (
				logLine &&
				relationship >= constants.RELATIONSHIP_FRIEND &&
				appConfig.configValue("logLinesFile")
			) {
				// Add to specific logs
				log.logCategoryLine(username.toLowerCase(), channelUri, logLine, time);
			}
		}

		// Display name

		let displayName = tags && tags["display-name"];

		if (serverName && username && displayName) {
			tags["display-name"] = displayName = stringUtils.clean(displayName);
			setUserCachedDisplayName(username, serverName, displayName);
		}

		// Highlights or private messages

		var highlightStrings = [], privateMessageHighlightUser;

		if (
			meUsername &&
			(
				!username ||
				username.toLowerCase() !== meUsername.toLowerCase()
			)
		) {
			// Highlighted? Add to specific logs

			highlightStrings = nicknames.getHighlightStringsForMessage(
				message, channelUri, meUsername
			);

			if (highlightStrings.length && appConfig.configValue("logLinesFile")) {
				log.logCategoryLine("mentions", channelUri, logLine, time);
			}

			// Check if this is a private message not from you

			let { channelType } = channelUtils.parseChannelUri(channelUri);

			if (channelType === constants.CHANNEL_TYPES.PRIVATE) {
				privateMessageHighlightUser = { username, displayName };
			}
		}

		// Store!

		let channelIdCache = ircConfig.channelIdCache();

		if (isSeenActivity) {
			let friendIdCache = friends.friendIdCache();
			lastSeen.updateLastSeen(
				channelUri, username, time, relationship, displayName,
				friendIdCache, channelIdCache
			);
		}

		messageCaches.setChannelIdCache(channelIdCache);
		messageCaches.cacheMessage(
			channelUri, serverName, username, symbol,
			time, type, message, tags, relationship, highlightStrings,
			privateMessageHighlightUser, messageToken, customCols
		);
	};

	const handleIncomingMessage = function(
		channelUri, serverName, username,
		time, type, message, tags, meUsername, messageToken = null
	) {
		const symbol = userLists.getUserCurrentSymbol(channelUri, username);
		const line = log.lineFormats[type].build(symbol, username, message);

		handleIncomingMessageEvent(
			channelUri, serverName, username, time, type, message, tags,
			meUsername, line, true, messageToken
		);
	};

	const handleIncomingEvent = function(
		channelUri, serverName, type, data, time, ircClient
	) {

		let eventVisibilitySetting = appConfig.configValue("showUserEvents");
		let localSetting = ircConfig.channelConfigValue(channelUri, "showUserEvents");

		if (typeof localSetting === "number") {
			eventVisibilitySetting = localSetting;
		}

		eventVisibilitySetting = eventVisibilitySetting || type === "connectionEvent";

		let username = data && data.username || "";

		if (username) {
			data.symbol = userLists.getUserCurrentSymbol(channelUri, username);
		}

		// Log

		if (eventVisibilitySetting) {
			const line = log.getLogLineFromData(type, data);

			if (line && appConfig.configValue("logLinesFile")) {
				log.logChannelLine(channelUri, line, time);
			}
		}

		// Channel user lists

		if (
			constants.USER_MODIFYING_EVENT_TYPES.indexOf(type) >= 0 &&
			username
		) {
			// Due to a fault in the node-irc API, they don't always remove this
			// until after the call, so let's just do this now...

			if (constants.PART_EVENT_TYPES.indexOf(type) >= 0) {
				userLists.deleteUserFromUserList(channelUri, username);
			}
			else if (type === "join") {
				userLists.addUserToUserList(
					channelUri, username, data.ident, data.hostname, [], ircClient
				);
			}
			else if (type === "mode") {
				let { argument, mode } = data;
				let [ modifier, modeLetter ] = Array.from(mode);

				if (argument && modifier === "+") {
					userLists.addModesInUserList(
						channelUri, argument, modeLetter, ircClient
					);
				}
				else if (argument && modifier === "-") {
					userLists.removeModesFromUserList(
						channelUri, argument, modeLetter, ircClient
					);
				}
			}

			if (io) {
				// Debounce to prevent many repeated calls
				if (!userListEmissionMethods[channelUri]) {
					userListEmissionMethods[channelUri] =
						_.debounce(function() {
							io.emitChannelUserListToRecipients(channelUri);
							userLists.reloadOnlineFriends();
						}, 500);
				}

				userListEmissionMethods[channelUri]();
			}
		}

		// Event

		if (!eventVisibilitySetting) {
			return;
		}

		// Display name

		const extraData = {};

		if (serverName && username) {
			extraData.displayName = getUserCachedDisplayName(username, serverName);
		}

		// Meta data

		const metadata = messageCaches.withUuid({
			channel: channelUri,
			relationship: username &&
				relationshipUtils.getRelationship(username, friends.currentFriendsList()),
			server: serverName,
			time: time || new Date(),
			type
		});

		const event = _.assign(metadata, data, extraData);

		messageCaches.setChannelIdCache(ircConfig.channelIdCache());

		// Bunched event

		if (
			constants.BUNCHABLE_EVENT_TYPES.indexOf(type) >= 0 &&
			(
				eventVisibilitySetting ===
				constants.USER_EVENT_VISIBILITY.COLLAPSE_PRESENCE ||
				eventVisibilitySetting ===
				constants.USER_EVENT_VISIBILITY.COLLAPSE_MESSAGES
			)
		) {
			messageCaches.cacheBunchableChannelEvent(channelUri, event);
		}

		// Normal event

		else {
			messageCaches.cacheChannelEvent(channelUri, event);
		}
	};

	const handleIncomingGlobalEvent = function(serverName, type, data, time) {
		let { username } = data;
		if (type === "quit" && username) {
			let channels = userLists.deleteUserFromAllUserLists(
				serverName, username
			);

			if (channels && channels.length) {
				// TODO: This should map to a non-global quit event, not a part event
				channels.forEach((channelUri) => {
					handleIncomingEvent(
						channelUri,
						serverName,
						"part",
						data,
						time,
						null
					);
				});
			}
		}
	};

	const handleIncomingUserList = function(channelUri, serverName, userList, ircClient) {
		userLists.setChannelUserList(
			channelUri,
			convertIrcUserList(userList, serverName),
			ircClient
		);
	};

	const handleSystemLog = function(serverName, message, level = "info", time = null) {
		if (level === "warn") {
			level = "warning";
		}

		if (appConfig.configValue("debug") || level === "warning" || level === "error") {
			let loggedMessage = serverName
				? `[${serverName}] ${message}`
				: message;

			if (level === "error") {
				console.error(loggedMessage);
			}
			else if (level === "warning") {
				console.warn(loggedMessage);
			}
			else {
				console.log(loggedMessage);
			}
		}

		const data = {
			level,
			message,
			server: serverName,
			time: time || new Date(),
			type: "log"
		};

		messageCaches.cacheCategoryMessage("system", messageCaches.withUuid(data));
	};

	const handleIrcConnectionStateChange = function(serverName, status) {

		let time = new Date();
		let state = ircConnectionState.currentIrcConnectionState();

		if (
			state[serverName] &&
			state[serverName].status === status
		) {
			// Ignore if status is already the given one
			return;
		}

		let config = ircConfig.currentIrcConfig();
		var info = null;

		if (config.find((c) => c.name === serverName)) {
			// Update status
			info = { status, time };
			ircConnectionState.storeConnectionState(serverName, info);
		}
		else {
			// No longer in config
			ircConnectionState.deleteConnectionState(serverName);
		}

		if (io) {
			io.emitIrcConnectionStatus(serverName, info);
		}

		// Propagate message to all channels in this server
		const channelList = ircConfig.getConfigPublicChannelsInServer(serverName);
		if (channelList && channelList.length) {
			channelList.forEach((channel) => {
				let type = "connectionEvent";
				let data = { server: serverName, status };
				handleIncomingEvent(
					channel, serverName, type, data, time
				);
			});
		}
	};

	const handleIrcNickChange = function(serverName, nick) {
		let info = { nick };
		ircConnectionState.addToConnectionState(serverName, info);

		if (io) {
			io.emitIrcConnectionStatus(
				serverName,
				ircConnectionState.currentIrcConnectionState()[serverName]
			);
		}
	};

	const handleIncomingCustomEvent = function(
		channelUri, serverName, username,
		time, type, message, tags, meUsername,
		logLine, isSeenActivity = true, messageToken = null,
		customCols = null
	) {
		handleIncomingMessageEvent(
			channelUri, serverName, username,
			time, type, message, tags, meUsername,
			logLine, isSeenActivity, messageToken, customCols
		);
	};

	// Display names

	var displayNameCache = {};

	const getUserCachedDisplayName = function(username, serverName) {
		let lastSeenUsers = lastSeen.lastSeenUsers();
		return (
			(displayNameCache[serverName] &&
				displayNameCache[serverName][username]) ||
			(lastSeenUsers[username] &&
				lastSeenUsers[username].displayName)
		);
	};

	const setUserCachedDisplayName = function(username, serverName, displayName) {
		if (!(serverName in displayNameCache)) {
			displayNameCache[serverName] = {};
		}
		displayNameCache[serverName][username] = displayName;
	};

	const convertIrcUserList = function(channelUserList, serverName) {
		// Expected format: { username: symbol, ... }
		let out = {};

		channelUserList.forEach((user) => {
			let username = user.nick;
			let displayName = getUserCachedDisplayName(username, serverName);
			out[username] = _.assign({}, user, { displayName });
		});

		return out;
	};

	return {
		getUserCachedDisplayName,
		handleIncomingCustomEvent,
		handleIncomingEvent,
		handleIncomingGlobalEvent,
		handleIncomingMessage,
		handleIncomingUserList,
		handleIrcConnectionStateChange,
		handleIrcNickChange,
		handleSystemLog
	};
};
