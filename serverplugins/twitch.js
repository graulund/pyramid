// PYRAMID
// Twitch support

const lodash = require("lodash");
const path = require("path");
const qs = require("querystring");
const request = require("request");

const util = require("../server/util");

const CLIENT_ID = "o1cax9hjz2h9yp1l6f2ph95d440cil";
const KRAKEN_BASE_URI = "https://api.twitch.tv/kraken/";
const CHATDEPOT_BASE_URI = "https://chatdepot.twitch.tv/";
const EMOTE_PREFIX_REGEX = "(\\s|^)";
const EMOTE_SUFFIX_REGEX = "(\\s|$)";
const USER_STATE_MESSAGE_FIELDS = [
	"badges", "color", "display-name", "mod", "subscriber", "turbo",
	"user-id", "user-type"
];

const EXTERNAL_GLOBAL_EMOTE_ENDPOINTS = [
	{ type: "ffz", url: "https://api.frankerfacez.com/v1/set/global" },
	{ type: "bttv", url: "https://api.betterttv.net/2/emotes" }
];

const EXTERNAL_CHANNEL_EMOTE_ENDPOINTS = [
	{ type: "ffz", prefix: "https://api.frankerfacez.com/v1/room/" },
	{ type: "bttv", prefix: "https://api.betterttv.net/2/channels/" }
];

const ASTRAL_SYMBOLS_REGEX = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

const EMOTE_RELOAD_INTERVAL_MS = 3600000;

var emoticonImages = {};
var roomStates = {};
var userStates = {};
var globalUserStates = {};

var externalGlobalEmotes = [];
var externalChannelEmotes = {};

var log = console.log;
var warn = console.warn;

// Utility methods ----------------------------------------------------------------------

const isTwitch = function(client) {
	if (client && client.extConfig) {
		return /irc\.(chat\.)?twitch\.tv/.test(client.extConfig.hostname);
	}

	return false;
};

const rangesOverlap = function (x1, x2, y1, y2) {
	var low1, low2, high1, high2;
	if (x1 <= y1) {
		low1 = x1;
		low2 = x2;
		high1 = y1;
		high2 = y2;
	}
	else {
		low1 = y1;
		low2 = y2;
		high1 = x1;
		high2 = x2;
	}

	return low1 <= high2 && high1 <= low2;
};

const stringWithoutAstralSymbols = function(str) {
	// Prevent index issues when astral symbols are involved in index-generating routine
	return str.replace(ASTRAL_SYMBOLS_REGEX, "_");
};

// Emoticons in messages ----------------------------------------------------------------

const parseSingleEmoticonIndices = function(data) {
	const seqs = data.split(":");

	if (seqs.length > 1) {
		const id = seqs[0], indicesString = seqs[1];
		const indices = indicesString.split(",").map((nums) => {
			const i = nums.split("-");
			return {
				first: parseInt(i[0], 10),
				last: parseInt(i[1], 10)
			};
		});
		return { id, indices };
	}

	return null;
};

const parseEmoticonIndices = function(dataString) {
	const emoteDatas = dataString.split("/");
	return emoteDatas.map(parseSingleEmoticonIndices).filter((em) => em !== null);
};

const generateEmoteRegex = function(code) {
	return new RegExp(EMOTE_PREFIX_REGEX + "(" + code + ")" + EMOTE_SUFFIX_REGEX, "g");
};

const doNewIndicesOverlap = function(indices, emotes) {
	if (emotes && emotes.length) {
		for (var i = 0; i < emotes.length; i++) {
			if (emotes[i] && emotes[i].indices) {
				for (var j = 0; j < emotes[i].indices.length; j++) {
					if (
						rangesOverlap(
							indices.first, indices.last,
							emotes[i].indices[j].first, emotes[i].indices[j].last
						)
					) {
						return true;
					}
				}

			}
		}
	}

	return false;
};

const generateEmoticonIndices = function(message, emoteData, emotes = []) {
	// Expected emotedata: [ { id, code } ...]
	if (message && message.length) {
		const cleanedMessage = stringWithoutAstralSymbols(message);
		emoteData.forEach((emote) => {
			if (emote && emote.id && emote.code) {
				const indices = [];
				const rgx = generateEmoteRegex(emote.code);

				while ((result = rgx.exec(cleanedMessage)) !== null) {

					// Calculate indices for this occurrence
					const prefix = result[1], code = result[2], suffix = result[3];
					const firstIndex = result.index + prefix.length;
					const lastIndex = firstIndex + code.length - 1;
					const localIndices = { first: firstIndex, last: lastIndex };

					if (!doNewIndicesOverlap(localIndices, emotes)) {
						indices.push(localIndices);
					}

					// Don't include the space suffix when doing the next search
					rgx.lastIndex -= suffix.length;
				}

				if (indices.length) {
					emotes.push(
						lodash.assign(lodash.omit(emote, ["code"]), { indices })
					);
				}
			}
		})
	}
	return emotes;
};

const populateLocallyPostedTags = function(tags, serverName, channel, message) {
	if (tags) {
		lodash.assign(
			tags,
			lodash.pick(globalUserStates[serverName], USER_STATE_MESSAGE_FIELDS),
			lodash.pick(userStates[channel], USER_STATE_MESSAGE_FIELDS),
			{
				emotes: generateEmoticonIndices(
						message,
						emoticonImages[
							userStates[channel]["emote-sets"] ||
							globalUserStates[serverName]["emote-sets"]
						]
					)
			}
		);
	}
}

// API response methods -----------------------------------------------------------------

const flattenEmoticonImagesData = function(data) {
	if (data && data.emoticon_sets) {
		const obj = data.emoticon_sets;
		var ids = [], list = [];
		lodash.forOwn(obj, (value, key) => {
			if (value && value.length) {
				value.forEach((emote) => {
					if (emote && emote.id) {
						if (ids.indexOf(emote.id) >= 0) {
							return;
						}

						// Special Twitch emote code weirdness
						emote.code = emote.code.replace(/\\&lt\\;/, "<");
						emote.code = emote.code.replace(/\\&gt\\;/, ">");

						list.push(emote);
						ids.push(emote.id);
					}
				});
			}
		});

		return list;
	}

	return null;
};

// API request methods ------------------------------------------------------------------

const clientIdRequest = function(url, callback, extraOptions = {}) {
	const options = lodash.merge(
		{
			url,
			headers: {
				"Client-ID": CLIENT_ID
			}
		},
		extraOptions
	);

	return request(options, callback);
};

const krakenGetRequest = function(commandName, query, callback) {
	const queryString = query ? qs.stringify(query) : "";
	return clientIdRequest(
		KRAKEN_BASE_URI + commandName +
		(queryString ? "?" + queryString : ""),
		callback,
		{ headers: { Accept: "application/vnd.twitchtv.v5+json" } }
	);
};

const chatdepotGetRequest = function(commandName, password, query, callback) {
	const oauthId = password.replace(/^oauth:/, "");
	const queryString = qs.stringify(lodash.extend({ oauth_token: oauthId }, query));
	return request(
		CHATDEPOT_BASE_URI + commandName +
		"?" + queryString,
		callback
	);
};

const requestEmoticonImages = function(emotesets) {
	log(`Requesting emoticon images for ${emotesets}`);
	krakenGetRequest(
		"chat/emoticon_images",
		{ emotesets },
		(error, response, body) => {
			try {
				const data = JSON.parse(body);
				emoticonImages[emotesets] =
					flattenEmoticonImagesData(data);

				log(`There are now ${emoticonImages[emotesets].length} emoticon images for ${emotesets}`);
			}
			catch(e) {
				console.warn("Error occurred trying to request emoticon images from the Twitch API.");
			}
		}
	);
};

const requestEmoticonImagesIfNeeded = function(emotesets) {
	if (!emoticonImages[emotesets]) {
		// Prevent further simultaneous requests
		emoticonImages[emotesets] = true;

		// Request
		requestEmoticonImages(emotesets);
	}
};

const reloadEmoticonImages = function() {
	log("Reloading emoticon images...");
	const queries = Object.keys(emoticonImages);
	queries.forEach((emotesets) => {
		requestEmoticonImages(emotesets);
	});
};

const parseExternalEmoticon = function(type, data) {
	if (data) {
		var sizes = null;

		if (typeof data.urls === "object") {
			sizes = Object.keys(data.urls);
		}

		return {
			code: lodash.escapeRegExp(data.code || data.name),
			id: data.id,
			imageType: data.imageType,
			sizes,
			type
		};
	}

	return null;
};

const parseExternalEmoticons = function(type, list) {
	const output = [];
	if (list) {
		list.forEach((data) => {
			const emote = parseExternalEmoticon(type, data);
			if (emote) {
				output.push(emote);
			}
		})
	}

	return output;
};

const storeExternalEmotes = function(type, store, list) {
	if (!store) {
		store = [];
	}
	return store.concat(parseExternalEmoticons(type, list));
};

const requestExternalGlobalEmoticons = function(enabledTypes) {
	if (!enabledTypes || !enabledTypes.length) {
		return;
	}

	var uncleared = true;
	EXTERNAL_GLOBAL_EMOTE_ENDPOINTS.forEach(({ type, url }) => {

		if (enabledTypes.indexOf(type) < 0) {
			return;
		}

		request(url, (error, response, body) => {
			if (!error && response.statusCode === 200) {
				try {
					const data = JSON.parse(body);
					if (uncleared) {
						uncleared = false;
						externalGlobalEmotes = [];
					}
					if (data.default_sets && data.sets) {
						// FFZ
						data.default_sets.forEach((setId) => {
							if (data.sets[setId]) {
								externalGlobalEmotes = storeExternalEmotes(
									type, externalGlobalEmotes, data.sets[setId].emoticons
								);
								log(`There are now ${externalGlobalEmotes.length} external global emotes (after ${type})`);
							}
						})
					}
					else if (data.emotes) {
						// BTTV
						externalGlobalEmotes = storeExternalEmotes(
							type, externalGlobalEmotes, data.emotes
						);
						log(`There are now ${externalGlobalEmotes.length} external global emotes (after ${type})`);
					}
				}
				catch(e) {
					console.warn(
						`Error occurred trying to get external global emoticons (${type})`,
						e
					);
				}
			}
		});
	});
};

const requestExternalChannelEmoticons = function(channel, enabledTypes) {
	if (!enabledTypes || !enabledTypes.length) {
		return;
	}

	const segs = channel.split("/");
	const channelName = segs[segs.length-1].replace(/^#/, "");
	var uncleared = true;

	if (channelName) {

		// Clear the list quickly if it doesn't exist already
		if (!(channel in externalChannelEmotes)) {
			uncleared = false;
			externalChannelEmotes[channel] = [];
		}

		EXTERNAL_CHANNEL_EMOTE_ENDPOINTS.forEach(({ type, prefix }) => {

			if (enabledTypes.indexOf(type) < 0) {
				return;
			}

			request(prefix + channelName, (error, response, body) => {
				if (!error && response.statusCode === 200) {
					try {
						const data = JSON.parse(body);

						// Clear it if it wasn't already cleared
						if (uncleared) {
							uncleared = false;
							externalChannelEmotes[channel] = [];
						}

						if (data.sets) {
							// FFZ
							lodash.forOwn(data.sets, (set) => {
								externalChannelEmotes[channel] = storeExternalEmotes(
									type, externalChannelEmotes[channel], set.emoticons
								);
							});

							log(`There are now ${externalChannelEmotes[channel].length} external emotes for ${channel} (after ${type})`);
						}
						else if (data.emotes) {
							// BTTV
							externalChannelEmotes[channel] = storeExternalEmotes(
								type, externalChannelEmotes[channel], data.emotes
							);

							log(`There are now ${externalChannelEmotes[channel].length} external emotes for ${channel} (after ${type})`);
						}
					}
					catch(e) {
						console.warn(
							`Error occurred trying to get external emoticons for ${channel} (${type})`,
							e
						);
					}
				}
			});
		});
	}
};

const getEnabledExternalEmoticonTypes = function(ffzEnabled, bttvEnabled) {
	const enabledTypes = [];

	if (ffzEnabled) {
		enabledTypes.push("ffz");
	}

	if (bttvEnabled) {
		enabledTypes.push("bttv");
	}

	return enabledTypes;
};

const requestGroupChatInfo = function(client, callback) {
	const serverName = client.extConfig.name;
	chatdepotGetRequest(
		"room_memberships",
		client.extConfig.password,
		{},
		function(error, response, body) {
			if (!error && response.statusCode === 200) {
				try {
					const data = JSON.parse(body);
					const memberships = data.memberships;
					const groupChats = [];
					memberships.forEach((membership) => {
						let { room } = membership;
						if (membership.is_confirmed) {
							groupChats.push({
								name: room.irc_channel,
								displayName: room.display_name
							});
						}
					});

					callback(null, groupChats);
				}
				catch(e) {
					console.warn(
						"Error occurred trying to get group chat info",
						e
					);

					callback(e);
				}
			} else {
				callback(error);
			}
		}
	);
};

// Event handlers -----------------------------------------------------------------------

module.exports = function(main) {

	log = main.log;
	warn = main.warn;

	// Utility

	const enabledGlobalEmoteTypes = () => {
		return getEnabledExternalEmoticonTypes(
			main.configValue("enableFfzEmoticons") &&
			main.configValue("enableFfzGlobalEmoticons"),
			main.configValue("enableBttvEmoticons") &&
			main.configValue("enableBttvGlobalEmoticons")
		);
	};

	const enabledChannelEmoteTypes = () => {
		return getEnabledExternalEmoticonTypes(
			main.configValue("enableFfzEmoticons") &&
			main.configValue("enableFfzChannelEmoticons"),
			main.configValue("enableBttvEmoticons") &&
			main.configValue("enableBttvChannelEmoticons")
		);
	};

	const loadExternalEmotesForClient = (client) => {
		if (isTwitch(client)) {
			const globalEnabledTypes = enabledGlobalEmoteTypes();
			requestExternalGlobalEmoticons(globalEnabledTypes);
		}
	};

	const loadExternalEmotesForChannel = (channel) => {
		const channelEnabledTypes = enabledChannelEmoteTypes();
		log(`Requesting external channel emoticons for ${channel}`);
		requestExternalChannelEmoticons(
			channel, channelEnabledTypes
		);
	};

	const clearExternalEmotesForChannel = (channel) => {
		log(`Clearing external channel emoticons for ${channel}`);
		delete externalChannelEmotes[channel];
	};

	const getExternalEmotesForChannel = (channel) => {
		const globalEnabledTypes = enabledGlobalEmoteTypes();
		const channelEnabledTypes = enabledChannelEmoteTypes();

		// Filter away the non-preferred types

		var g = externalGlobalEmotes.filter(
			({ type }) => globalEnabledTypes.indexOf(type) >= 0
		);
		var c = (externalChannelEmotes[channel] || []).filter(
			({ type }) => channelEnabledTypes.indexOf(type) >= 0
		);

		// Filter away animated emotes

		if (!main.configValue("enableBttvAnimatedEmoticons")) {
			g = g.filter(({ imageType }) => imageType !== "gif");
			c = c.filter(({ imageType }) => imageType !== "gif");
		}

		// Combine and return

		return g.concat(c);
	};

	const updateGroupChatInfo = function(client) {
		let autoJoin = main.configValue("automaticallyJoinTwitchGroupChats");
		let useDisplayNames = main.configValue("enableTwitchChannelDisplayNames");
		let serverName = client.extConfig.name;

		if (autoJoin || useDisplayNames) {
			log("Updating Twitch group chat info...");
			requestGroupChatInfo(client, function(error, channels) {
				if (!error && channels) {
					channels.forEach((channel) => {
						let { name, displayName } = channel;
						main.modifyChannelInIrcConfig(
							serverName,
							name,
							{ displayName }
						);
					});

					if (autoJoin) {
						let ircConfigs = main.safeIrcConfigDict();
						let config = ircConfigs[serverName];

						if (config && config.channels) {
							let configChannels = Object.keys(config.channels);
							channels.forEach((channel) => {
								let { name, displayName } = channel;
								if (name && configChannels.indexOf(name) < 0) {
									log(
										"Found and added Twitch group chat: " +
										name
									);
									main.addAndJoinChannel(
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
	};

	// Events

	const onConnect = (data) => {
		const { client } = data;
		if (isTwitch(client)) {
			client.send(
				"CAP", "REQ",
				"twitch.tv/commands twitch.tv/membership twitch.tv/tags"
			);

			loadExternalEmotesForClient(client);
			updateGroupChatInfo(client);
		}
	};

	const onJoin = function(data) {
		const { client, channel, username } = data;
		if (isTwitch(client) && username === client.nick) {
			loadExternalEmotesForChannel(channel);
		}
	};

	const onPart = function(data) {
		const { client, channel, username } = data;
		if (
			isTwitch(client) &&
			username === client.nick &&
			externalChannelEmotes[channel]
		) {
			clearExternalEmotesForChannel(channel);
		}
	};

	const onMessageTags = function(data) {
		var {
			client, channel, message, meUsername, postedLocally,
			serverName, tags, username
		} = data;

		if (isTwitch(client)) {
			if (!tags) {
				tags = data.tags = {};
			}

			if (tags.emotes) {
				if (typeof tags.emotes === "string") {
					tags.emotes = parseEmoticonIndices(tags.emotes);
				}
			}
			else if (
				postedLocally && username === meUsername &&
				userStates[channel] &&
				emoticonImages[userStates[channel]["emote-sets"]]
			) {
				// We posted this message
				populateLocallyPostedTags(tags, serverName, channel, message);
			}
			else if ("emotes" in tags) {
				// Type normalization
				tags.emotes = [];
			}

			// Add external emotes
			tags.emotes = generateEmoticonIndices(
				message,
				getExternalEmotesForChannel(channel),
				tags.emotes || []
			);
		}
	};

	const onCustomMessage = function(data) {
		const { channel, client, message, serverName } = data;
		if (message && message.command && isTwitch(client)) {
			switch(message.command) {
				case "USERSTATE":
				case "GLOBALUSERSTATE":
					if (message.tags) {
						if (message.command === "GLOBALUSERSTATE") {
							globalUserStates[serverName] = message.tags;
						}
						else {
							userStates[channel] = message.tags;
						}

						if (message.tags["emote-sets"]) {
							requestEmoticonImagesIfNeeded(message.tags["emote-sets"]);
						}
					}
					break;
				case "ROOMSTATE":
					if (message.tags) {
						roomStates[channel] = message.tags;
						// TODO: Notify main
					}
					break;
			}
		}
	};

	const loadExternalEmotesForAllClients = () => {
		log("Reloading emotes for all clients...");

		const clients = main.currentIrcClients();

		if (clients && clients.length) {
			clients.forEach((client) => loadExternalEmotesForClient(client));
		}
	};

	// Reload emotes and group chat data every hour

	setInterval(
		reloadEmoticonImages,
		EMOTE_RELOAD_INTERVAL_MS
	);

	setInterval(
		loadExternalEmotesForAllClients,
		EMOTE_RELOAD_INTERVAL_MS
	);

	setInterval(
		updateGroupChatInfo,
		EMOTE_RELOAD_INTERVAL_MS
	);

	// React to external emote settings changes

	main.addConfigValueChangeHandler(
		[
			"enableFfzEmoticons",
			"enableFfzGlobalEmoticons",
			"enableFfzChannelEmoticons",
			"enableBttvEmoticons",
			"enableBttvGlobalEmoticons",
			"enableBttvAnimatedEmoticons",
			"enableBttvPersonalEmoticons"
		],
		loadExternalEmotesForAllClients
	);

	// Events API

	return {
		onConnect,
		onCustomMessage,
		onJoin,
		onMessageTags,
		onPart
	};
};
