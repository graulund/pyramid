const _ = require("lodash");

const { CHANNEL_TYPES } = require("../../server/constants");
const channelUtils = require("../../server/util/channels");
const stringUtils = require("../../server/util/strings");

const badges = require("./badges");
const emotes = require("./emotes");
const externalEmotes = require("./externalEmotes");
const groupChats = require("./groupChats");
const twitchApiData = require("./twitchApiData");
const users = require("./users");
const userStates = require("./userStates");
const util = require("./util");

const METADATA_RELOAD_INTERVAL_MS = 3600000;
const MIN_TIME_BETWEEN_GROUP_CHAT_CALLS_MS = 10000;

var twitchChannelCache = [], twitchRoomIdCache = {};
var lastGroupChatCallTimes = {};

module.exports = function(main) {

	util.setMain(main);

	// Utility

	const enabledGlobalEmoteTypes = function() {
		let appConfig = main.appConfig();
		return util.getEnabledExternalEmoticonTypes(
			appConfig.configValue("enableFfzEmoticons") &&
			appConfig.configValue("enableFfzGlobalEmoticons"),
			appConfig.configValue("enableBttvEmoticons") &&
			appConfig.configValue("enableBttvGlobalEmoticons")
		);
	};

	const enabledChannelEmoteTypes = function() {
		let appConfig = main.appConfig();
		return util.getEnabledExternalEmoticonTypes(
			appConfig.configValue("enableFfzEmoticons") &&
			appConfig.configValue("enableFfzChannelEmoticons"),
			appConfig.configValue("enableBttvEmoticons") &&
			appConfig.configValue("enableBttvChannelEmoticons")
		);
	};

	const loadExternalEmotesForClient = function(client) {
		if (util.isTwitch(client)) {
			const globalEnabledTypes = enabledGlobalEmoteTypes();
			externalEmotes.requestExternalGlobalEmoticons(globalEnabledTypes);
		}
	};

	const loadExternalEmotesForChannel = function(channel) {
		const channelEnabledTypes = enabledChannelEmoteTypes();
		util.log(`Requesting external channel emoticons for ${channel}`);
		externalEmotes.requestExternalChannelEmoticons(
			channel, channelEnabledTypes
		);
	};

	const getExternalEmotesForChannel = function(channel) {
		const globalEnabledTypes = enabledGlobalEmoteTypes();
		const channelEnabledTypes = enabledChannelEmoteTypes();

		let globalEmotes = externalEmotes.getExternalGlobalEmotes();
		let channelEmotes = externalEmotes.getExternalEmotesForChannel(channel);

		// Filter away the non-preferred types

		var g = globalEmotes.filter(
			({ type }) => globalEnabledTypes.indexOf(type) >= 0
		);
		var c = channelEmotes.filter(
			({ type }) => channelEnabledTypes.indexOf(type) >= 0
		);

		// Filter away animated emotes

		if (!main.appConfig().configValue("enableBttvAnimatedEmoticons")) {
			g = g.filter(({ imageType }) => imageType !== "gif");
			c = c.filter(({ imageType }) => imageType !== "gif");
		}

		// Combine and return

		return g.concat(c);
	};

	const updateChatDisplayName = function(
		serverName, channelName, channelInfo, evalDisplayName, setDisplayName
	) {
		if (
			evalDisplayName &&
			evalDisplayName !== channelName &&
			(
				!channelInfo ||
				setDisplayName !== channelInfo.displayName
			)
		) {
			main.ircConfig().modifyChannelInIrcConfig(
				serverName,
				channelName,
				{ displayName: setDisplayName },
				() => main.ircConfig().loadAndEmitIrcConfig()
			);
		}
	};

	const updateGroupChatInfo = function(client) {

		if (!util.isTwitch(client)) {
			return;
		}

		let serverName = client.config.name;

		if (
			lastGroupChatCallTimes[serverName] &&
			new Date() - lastGroupChatCallTimes[serverName] <
				MIN_TIME_BETWEEN_GROUP_CHAT_CALLS_MS
		) {
			// Don't call so fast
			return;
		}

		let appConfig = main.appConfig();
		let autoJoin = appConfig.configValue("automaticallyJoinTwitchGroupChats");
		let useDisplayNames = appConfig.configValue("enableTwitchChannelDisplayNames");

		let token = main.ircPasswords().getDecryptedPasswordForServer(serverName);
		let configChannels = client.config.channels;

		if (autoJoin || useDisplayNames) {
			if (token) {
				util.log("Updating Twitch group chat info...");
				groupChats.requestGroupChatInfo(token, function(error, channels) {
					if (!error && channels) {
						channels.forEach((channel) => {
							let { name, displayName } = channel;
							let configChannel = configChannels
								.find((c) => c.name === name);

							updateChatDisplayName(
								serverName,
								name,
								configChannel,
								displayName,
								displayName
							);
						});

						if (autoJoin) {
							let ircConfigs = main.ircConfig().safeIrcConfigDict();
							let config = ircConfigs[serverName];

							if (config && config.channels) {
								let configChannels = Object.keys(config.channels);
								channels.forEach((channel) => {
									let { name, displayName } = channel;
									if (name && configChannels.indexOf(name) < 0) {
										util.log(
											"Found and added Twitch group chat: " +
											name
										);
										main.ircControl().addAndJoinChannel(
											serverName,
											name,
											{ displayName }
										);
									}
								});
							}
						}
					}
				});
			}

			else {
				util.warn(
					"Tried to update Twitch group chat info, " +
					"but couldn't find your oauth token"
				);
			}
		}

		lastGroupChatCallTimes[serverName] = new Date();
	};

	const updateUserChatInfo = function(client, username) {
		if (!util.isTwitch(client)) {
			return;
		}

		let appConfig = main.appConfig();
		let useDisplayNames = appConfig.configValue("enableTwitchChannelDisplayNames");
		let serverName = client.config.name;
		let channel = client.config.channels
			.find((channel) => channel.name === username);

		if (useDisplayNames) {
			util.log(`Updating Twitch user info for ${username}...`);

			users.requestTwitchUserInfo(username, function(err, data) {
				if (!err && data && data.display_name) {
					let displayName = stringUtils.clean(data.display_name);
					let channelDisplayName = "#" + displayName;

					updateChatDisplayName(
						serverName,
						username,
						channel,
						displayName,
						channelDisplayName
					);
				}
			});
		}
	};

	const updateUserChatInfoForClient = function(client) {
		if (!util.isTwitch(client)) {
			return;
		}

		client.config.channels.forEach((channel) => {
			if (channel.name && !util.channelIsGroupChat(channel.name)) {
				updateUserChatInfo(client, channel.name);
			}
		});
	};

	const updateChatInfoForJoinedChannel = function(client, channel) {
		if (!util.isTwitch(client)) {
			return;
		}

		let channelName = channelUtils.channelNameFromUri(channel);
		if (channelName) {
			if (!util.channelIsGroupChat(channelName)) {
				// Load just this user info
				updateUserChatInfo(client, channelName);
			}

			else {
				// Reload all group chat info if we can
				updateGroupChatInfo(client);
			}
		}
	};

	const getGlobalBadgeDataForServer = function(client) {
		if (!util.isTwitch(client)) {
			return;
		}

		let serverName = client.config.name;
		twitchApiData.requestGlobalBadgeData(function(data) {
			if (data && data.badge_sets) {
				main.serverData().setServerData(
					serverName, { badgeData: data.badge_sets }
				);
			}
		});
	};

	const getBadgeDataForChannel = function(channel, roomId) {
		twitchApiData.requestChannelBadgeData(roomId, function(data) {
			if (data && data.badge_sets) {
				main.channelData().setChannelData(
					channel, { badgeData: data.badge_sets }
				);
			}
		});
	};

	// Events

	const onIrcFrameworkConfig = (data) => {
		let { config } = data;
		if (config && util.isTwitchHostname(config.host)) {
			// Longer message max length than normal IRC networks
			config.message_max_length = 500;
		}
	};

	const onClient = (data) => {
		let { client } = data;
		if (util.isTwitch(client)) {
			client.irc.requestCap([
				"twitch.tv/commands",
				"twitch.tv/membership",
				"twitch.tv/tags"
			]);

			// TODO: Re-evaluate this property on modify server
			main.serverData().setServerData(client.config.name, { isTwitch: true });
			loadExternalEmotesForClient(client);
			updateGroupChatInfo(client);

			// TODO: Only do these if the user has the setting on
			// (and do them once they turn it on)
			getGlobalBadgeDataForServer(client);
			twitchApiData.requestGlobalCheerData();
		}
	};

	const onJoin = function(data) {
		const { client, channel, meUsername, username } = data;
		if (
			util.isTwitch(client) &&
			username === meUsername
		) {
			twitchChannelCache = _.uniq(twitchChannelCache.concat([channel]));
			loadExternalEmotesForChannel(channel);
			updateChatInfoForJoinedChannel(client, channel);
		}
	};

	const onPart = function(data) {
		const { client, channel, meUsername, username } = data;
		if (
			util.isTwitch(client) &&
			username === meUsername
		) {
			externalEmotes.clearExternalEmotesForChannel(channel);
			twitchChannelCache = _.without(twitchChannelCache, channel);
			delete twitchRoomIdCache[channel];
		}
	};

	const onMessageTags = function(message) {
		let { client, channel, tags } = message;

		if (util.isTwitch(client)) {
			if (!tags) {
				tags = message.tags = {};
			}

			// Cheers

			let roomId = twitchRoomIdCache[channel];
			let cheerData = twitchApiData.getCheerData(0);

			if (roomId) {
				cheerData = twitchApiData.getCheerData(roomId).concat(cheerData);
			}

			// Emotes

			let externalEmotes = getExternalEmotesForChannel(channel);
			emotes.prepareEmotesInMessage(
				message,
				externalEmotes,
				cheerData // TODO: respect setting
			);

			// Badges

			badges.parseBadgesInTags(tags);
		}
	};

	const onCustomMessage = function(data) {
		const { channel, client, message, meUsername, serverName, time } = data;
		if (message && message.command && util.isTwitch(client)) {
			let { command, tags } = message;
			switch(command) {
				case "USERSTATE":
				case "GLOBALUSERSTATE":
					if (tags) {
						badges.parseBadgesInTags(tags);
						userStates.handleNewUserState(data);
					}
					break;

				case "ROOMSTATE":
					if (message.tags) {
						let channelData = main.channelData();
						let currentData = channelData.getChannelData(channel);
						let oldRoomState = currentData && currentData.roomState || {};
						let roomState = _.assign(oldRoomState, message.tags);
						let roomId = roomState["room-id"];

						main.channelData().setChannelData(channel, { roomState });

						if (roomId && roomId !== "0") {
							twitchRoomIdCache[channel] = roomId;
							getBadgeDataForChannel(channel, roomId);
							twitchApiData.requestChannelCheerData(roomId);
						}
					}
					break;

				case "USERNOTICE": {
					let username = message.tags && message.tags.login;
					let messageText = message.params[1] || "";

					let tagsInfo = {
						client,
						channel,
						message: messageText,
						meUsername,
						postedLocally: false,
						serverName,
						tags: message.tags,
						username
					};

					main.plugins().handleEvent("messageTags", tagsInfo);

					main.incomingEvents().handleIncomingCustomEvent(
						channel, serverName, username,
						time, "usernotice", messageText, message.tags, null,
						"", true
					);
					break;
				}

				case "CLEARCHAT": {
					let duration = message.tags && message.tags["ban-duration"];
					let reason = message.tags && message.tags["ban-reason"];
					let clearedUsername = message.params[1] || "";

					if (!clearedUsername) {
						// No user
						break;
					}

					let announcement = duration && duration > 0
						? `has been timed out for ${duration} ` +
							stringUtils.pluralize(duration, "second", "s")
						: "has been banned";

					let line = reason
						? announcement + ": " + reason
						: announcement + ".";

					let extraData = null;
					let displayName = main.incomingEvents()
						.getUserCachedDisplayName(clearedUsername, serverName);

					if (displayName) {
						extraData = { displayName };
					}

					main.incomingEvents().handleIncomingCustomEvent(
						channel, serverName, clearedUsername,
						time, "clearchat", line, message.tags, null,
						`** ${clearedUsername} ${line}`, true, null,
						extraData
					);
					break;
				}

				case "WHISPER": {
					let username = message.nick;
					let messageText = message.params[1] || "";
					let tags = message.tags;

					handleIncomingWhisper(
						client, serverName, username, username,
						time, messageText, tags, meUsername, false
					);

					break;
				}
			}
		}
	};

	const handleIncomingWhisper = function(
		client, serverName, convoUsername, authorUsername,
		time, messageText, tags, meUsername, postedLocally, messageToken = null
	) {
		let channel = channelUtils.getPrivateConversationUri(
			serverName, convoUsername
		);

		let meRegex = /^\/me\s+/, isAction = false;

		if (meRegex.test(messageText)) {
			isAction = true;
			messageText = messageText.replace(meRegex, "");
		}

		let type = isAction ? "action" : "msg";

		let tagsInfo = {
			client,
			channel,
			message: messageText,
			meUsername,
			postedLocally,
			serverName,
			tags,
			username: authorUsername
		};

		main.plugins().handleEvent("messageTags", tagsInfo);

		main.incomingEvents().handleIncomingMessage(
			channel, serverName, authorUsername,
			time, type, messageText, tags, meUsername, messageToken
		);
	};

	const onSendOutgoingMessage = function(data /*, callback */ ) {
		let { uriData } = data;

		if (uriData.channelType === CHANNEL_TYPES.PRIVATE) {
			// Twitch behaviour for private messages is a little special...

			let { channel, client, message, messageToken } = data;
			let { server } = uriData;
			let getIrcChannelName = main.ircControl().getIrcChannelNameFromUri;
			let meUsername = client.irc.user.nick;
			let username = getIrcChannelName(channel);
			let time = new Date();

			// Pick a random channel to send a /w command to

			let channels = twitchChannelCache.filter(
				(u) => u.substr(0, server.length) === server
			);
			let gatewayChannel = channels.length
				? getIrcChannelName(channels[0])
				: "#jtv";

			// Send
			// TODO: Do not pipe through *all* IRC /commands

			let prefix = `/w ${username} `;
			let blocks = client.irc.say(gatewayChannel, prefix + message);

			if (!blocks || !blocks.length) {
				blocks = [message];
			}

			// Handle custom incoming completely different from what was sent

			let firstBlock = blocks[0];

			if (firstBlock.substr(0, prefix.length) === prefix) {
				blocks[0] = firstBlock.substr(prefix.length);
			}

			blocks.forEach((m) => {
				handleIncomingWhisper(
					client, server, username, meUsername,
					time, m, {}, meUsername, true, messageToken
				);
			});

			// Do not call the default action in the callback
			return true;
		}
	};

	// Utility requiring main

	const loadGlobalExternalEmotesForAllClients = function() {
		util.log("Reloading global external emotes for all clients...");

		const clients = main.ircControl().currentIrcClients();

		if (clients && clients.length) {
			clients.forEach((client) => loadExternalEmotesForClient(client));
		}
	};

	const loadExternalEmotesForAllChannels = function() {
		util.log("Reloading external emotes for all channels...");

		twitchChannelCache.forEach(
			(channel) => loadExternalEmotesForChannel(channel)
		);
	};

	const reloadAllExternalEmotes = function() {
		loadGlobalExternalEmotesForAllClients();
		loadExternalEmotesForAllChannels();
	};

	const reloadBadgeDataForAllChannels = function() {
		util.log("Reloading badge data for all channels...");

		_.forOwn(twitchRoomIdCache, function(roomId, channel) {
			getBadgeDataForChannel(channel, roomId);
		});
	};

	const reloadCheerDataForAllChannels = function() {
		util.log("Reloading cheer data for all channels...");

		_.forOwn(twitchRoomIdCache, function(roomId) {
			twitchApiData.requestChannelCheerData(roomId);
		});
	};

	const reloadMetadataForAllClients = function() {
		const clients = main.ircControl().currentIrcClients();

		if (clients && clients.length) {
			clients.forEach((client) => updateGroupChatInfo(client));
			clients.forEach((client) => updateUserChatInfoForClient(client));
			clients.forEach((client) => getGlobalBadgeDataForServer(client));
		}

		twitchApiData.reloadEmoticonImages();
		reloadAllExternalEmotes();
		reloadBadgeDataForAllChannels();
		twitchApiData.requestGlobalCheerData();
		reloadCheerDataForAllChannels();
	};

	// Reload required meta data every hour

	setInterval(
		reloadMetadataForAllClients,
		METADATA_RELOAD_INTERVAL_MS
	);

	// React to external emote settings changes

	setTimeout(function() {
		let appConfig = main.appConfig();

		if (appConfig) {
			appConfig.addConfigValueChangeHandler(
				[
					"enableFfzEmoticons",
					"enableFfzGlobalEmoticons",
					"enableFfzChannelEmoticons",
					"enableBttvEmoticons",
					"enableBttvGlobalEmoticons",
					"enableBttvAnimatedEmoticons",
					"enableBttvPersonalEmoticons"
				],
				reloadAllExternalEmotes
			);
		}
	}, 10000);

	// Events API

	return {
		onClient,
		onCustomMessage,
		onIrcFrameworkConfig,
		onJoin,
		onMessageTags,
		onPart,
		onSendOutgoingMessage
	};
};
