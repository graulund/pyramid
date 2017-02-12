// PYRAMID
// Twitch support

const lodash = require("lodash");
const qs = require("querystring");
const request = require("request");

const CLIENT_ID = "o1cax9hjz2h9yp1l6f2ph95d440cil";
const KRAKEN_BASE_URI = "https://api.twitch.tv/kraken/";
const EMOTE_PREFIX_REGEX = "(\\s|^)";
const EMOTE_SUFFIX_REGEX = "(\\s|$)";
const USER_STATE_MESSAGE_FIELDS = [
	"badges", "color", "display-name", "mod", "subscriber", "turbo",
	"user-id", "user-type"
];

var emoticonImages = {};
var roomStates = {};
var userStates = {};
var globalUserStates = {};

// Utility methods ----------------------------------------------------------------------

const isTwitch = function(client) {
	if (client && client.extConfig) {
		return /irc\.(chat\.)?twitch\.tv/.test(client.extConfig.server);
	}

	return null;
};

// Emoticons in messages ----------------------------------------------------------------

const parseSingleEmoticonIndices = function(data) {
	const seqs = data.split(":");

	if (seqs.length > 1) {
		const number = seqs[0], indicesString = seqs[1];
		const indices = indicesString.split(",").map((nums) => {
			const i = nums.split("-");
			return {
				first: parseInt(i[0], 10),
				last: parseInt(i[1], 10)
			};
		});
		return { number, indices };
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

const generateEmoticonIndices = function(message, emoteData) {
	// Expected emotedata: [ { id, code } ...]
	const emotes = [];
	if (message && message.length) {
		emoteData.forEach((emote) => {
			if (emote && emote.id && emote.code) {
				const indices = [];
				const rgx = generateEmoteRegex(emote.code);

				while ((result = rgx.exec(message)) !== null) {

					// Calculate indices for this occurrence
					const prefix = result[1], code = result[2], suffix = result[3];
					const firstIndex = result.index + prefix.length;
					const lastIndex = firstIndex + code.length - 1;

					indices.push({ first: firstIndex, last: lastIndex });

					// Don't include the space suffix when doing the next search
					rgx.lastIndex -= suffix.length;
				}

				if (indices.length) {
					emotes.push({
						number: emote.id,
						indices
					});
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
		callback
	);
};

const requestEmoticonImages = function(emotesets) {
	krakenGetRequest(
		"chat/emoticon_images",
		{ emotesets },
		(error, response, body) => {
			try {
				const data = JSON.parse(body);
				emoticonImages[emotesets] =
					flattenEmoticonImagesData(data);
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


// Event handlers -----------------------------------------------------------------------

module.exports = function(main) {

	const onConnect = (data) => {
		const { client } = data;
		if (isTwitch(client)) {
			client.send(
				"CAP", "REQ",
				"twitch.tv/commands twitch.tv/membership twitch.tv/tags"
			);
		}
	};

	const onMessageTags = function(data) {
		const {
			client, channel, message, meUsername, postedLocally,
			serverName, tags, username
		} = data;
		if (isTwitch(client)) {
			if (tags) {
				if (tags.emotes) {
					if (typeof tags.emotes === "string") {
						tags.emotes = parseEmoticonIndices(tags.emotes);
					}
				}
				else if (
					postedLocally && username === meUsername &&
					userStates[channel] && emoticonImages[userStates[channel]["emote-sets"]]
				) {
					// We posted this message
					populateLocallyPostedTags(tags, serverName, channel, message);
				}
				else if ("emotes" in tags) {
					// Type normalization
					tags.emotes = [];
				}
			}
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

	return {
		onConnect,
		onCustomMessage,
		onMessageTags
	};
};
