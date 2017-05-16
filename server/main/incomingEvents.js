const lodash = require("lodash");

const constants = require("../constants");
const log = require("../log");
const util = require("../util");

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

	const handleIncomingMessage = function(
		channelUri, channelName, serverName, username,
		time, type, message, tags, meUsername
	) {
		const symbol = userLists.getUserCurrentSymbol(channelUri, username);
		const line = log.lineFormats[type].build(symbol, username, message);

		// Log

		if (appConfig.configValue("logLinesFile")) {
			log.logChannelLine(channelUri, channelName, line, time);
		}
		else if (appConfig.configValue("debug")) {
			console.log(`[${channelName}] ${line}`);
		}

		// Is this from a person among our friends? Note down "last seen" time.

		const relationship = util.getRelationship(username, friends.currentFriendsList());

		if (
			relationship >= constants.RELATIONSHIP_FRIEND &&
			appConfig.configValue("logLinesFile")
		) {
			// Add to specific logs
			log.logCategoryLine(username.toLowerCase(), channelUri, channelName, line, time);
		}

		// Highlighted? Add to specific logs

		var highlightStrings = [];
		if (!username || username.toLowerCase() !== meUsername.toLowerCase()) {
			highlightStrings = nicknames.getHighlightStringsForMessage(
				message, channelUri, meUsername
			);

			if (highlightStrings.length) {
				if (appConfig.configValue("logLinesFile")) {
					log.logCategoryLine("mentions", channelUri, channelName, line, time);
				}
			}
		}

		// Display name

		const displayName = tags && tags["display-name"];

		if (serverName && username && displayName) {
			setUserCachedDisplayName(username, serverName, displayName);
		}

		// Store!

		lastSeen.updateLastSeen(
			channelUri, username, time, relationship, displayName
		);
		messageCaches.cacheMessage(
			channelUri, channelName, serverName, username, symbol,
			time, type, message, tags, relationship, highlightStrings
		);
	};

	const handleIncomingEvent = function(
		channelUri, channelName, serverName, type, data, time,
		channelUserList
	) {

		let username = data && data.username || "";

		if (username) {
			data.symbol = userLists.getUserCurrentSymbol(channelUri, username);
		}

		// Log

		const line = log.getLogLineFromData(type, data);

		if (line && appConfig.configValue("logLinesFile")) {
			log.logChannelLine(channelUri, channelName, line, time);
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

			userLists.setChannelUserList(
				channelUri,
				convertIrcUserList(channelUserList, serverName)
			);

			if (io) {
				io.emitChannelUserListToRecipients(channelUri);
			}
		}

		// Display name

		const extraData = {};

		if (serverName && username) {
			extraData.displayName = getUserCachedDisplayName(username, serverName);
		}

		// Meta data

		const metadata = messageCaches.withUuid({
			channel: channelUri,
			channelName,
			relationship: username && util.getRelationship(username, friends.currentFriendsList()),
			server: serverName,
			time: time || new Date(),
			type
		});

		const event = lodash.assign(metadata, data, extraData);

		if (constants.BUNCHABLE_EVENT_TYPES.indexOf(type) >= 0) {
			messageCaches.cacheBunchableChannelEvent(channelUri, event);
		} else {
			messageCaches.cacheChannelEvent(channelUri, event);
		}
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
		const channelList = ircConfig.getConfigChannelsInServer(serverName);
		if (channelList && channelList.length) {
			channelList.forEach((channel) => {
				let channelName = util.channelNameFromUrl(channel, "#");
				let type = "connectionEvent";
				let data = { server: serverName, status };
				handleIncomingEvent(
					channel, channelName, serverName, type, data, time
				);
			});
		}
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

		// Try to update this user's channel display name if it's in our list
		// TODO: Move this to Twitch only
		// TODO: Use API instead: https://api.twitch.tv/kraken/users?login=username&api_version=5&oauth_token=oauthtoken
		let config = ircConfig.currentIrcConfig()
			.find((c) => c.name === serverName);
		if (username.charAt(0) !== "_" && config) {
			let channel = config.channels.find((channel) => channel.name === username);
			let channelDisplayName = "#" + displayName;
			if (channel && channel.displayName !== channelDisplayName) {
				channel.displayName = channelDisplayName;
				ircConfig.modifyChannelInIrcConfig(
					serverName,
					username,
					{ displayName: channelDisplayName },
					() => ircConfig.loadIrcConfig()
				);
			}
		}
	};

	const convertIrcUserList = function(channelUserList, serverName) {
		// Expected format: { username: symbol, ... }
		return lodash.mapValues(channelUserList, (symbol, username) => {
			let displayName = getUserCachedDisplayName(username, serverName);
			return { displayName, symbol };
		});
	};


	return {
		handleIncomingMessage,
		handleIncomingEvent,
		handleIrcConnectionStateChange,
		handleSystemLog
	};
};
