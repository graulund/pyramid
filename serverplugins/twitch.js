// PYRAMID
// Twitch support

const lodash = require("lodash");
const qs = require("querystring");
const request = require("request");

const CLIENT_ID = "o1cax9hjz2h9yp1l6f2ph95d440cil";
const KRAKEN_BASE_URI = "https://api.twitch.tv/kraken/";

var emoticonImages = {};
var roomStates = {};
var userStates = {};

// Utility methods

const isTwitch = function(client) {
	if (client && client.extConfig) {
		return /irc\.(chat\.)?twitch\.tv/.test(client.extConfig.server);
	}

	return null;
};

const parseSingleEmoticonIndices = function(data) {
	const seqs = data.split(":");

	if (seqs.length > 1) {
		const number = seqs[0], indicesString = seqs[1];
		const indices = indicesString.split(",").map((nums) => {
			const i = nums.split("-");
			return {
				start: parseInt(i[0], 10),
				end: parseInt(i[1], 10)
			};
		});
		return { number, indices };
	}

	return null;
};

const parseEmoticonIndices = function(dataString) {
	const emoteDatas = dataString.split("/");
	return emoteDatas.map(parseSingleEmoticonIndices);
};

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
}

// API methods

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

module.exports = function(main) {
	// Event handlers

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
		const { client, tags } = data;
		if (tags && isTwitch(client)) {
			if (typeof tags.emotes === "string") {
				tags.emotes = parseEmoticonIndices(tags.emotes);
			}
		}
	};

	const onCustomMessage = function(data) {
		const { channel, client, message } = data;
		if (message && message.command && isTwitch(client)) {
			switch(message.command) {
				case "USERSTATE":
					if (message.tags) {
						userStates[channel] = message.tags;

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
