const _ = require("lodash");

const { queueRequest } = require("./httpRequests");
const util = require("./util");

const EXTERNAL_GLOBAL_EMOTE_ENDPOINTS = [
	{ type: "ffz", url: "https://api.frankerfacez.com/v1/set/global" },
	{ type: "bttv", url: "https://api.betterttv.net/2/emotes" }
];

const EXTERNAL_CHANNEL_EMOTE_ENDPOINTS = [
	{ type: "ffz", prefix: "https://api.frankerfacez.com/v1/room/" },
	{ type: "bttv", prefix: "https://api.betterttv.net/2/channels/" }
];

var externalGlobalEmotes = [];
var externalChannelEmotes = {};

// Utility

const parseExternalEmoticon = function(type, data) {
	if (data) {
		var sizes = null;

		if (typeof data.urls === "object") {
			sizes = Object.keys(data.urls);
		}

		return {
			code: _.escapeRegExp(data.code || data.name),
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
		});
	}

	return output;
};

const storeExternalEmotes = function(type, store, list) {
	if (!store) {
		store = [];
	}
	return store.concat(parseExternalEmoticons(type, list));
};

// Main

const getExternalGlobalEmotes = function() {
	return externalGlobalEmotes;
};

const getExternalEmotesForChannel = function(channel) {
	return externalChannelEmotes[channel] || [];
};

const clearExternalEmotesForChannel = function(channel) {
	util.log(`Clearing external channel emoticons for ${channel}`);
	delete externalChannelEmotes[channel];
};

const requestExternalGlobalEmoticons = function(enabledTypes) {
	if (!enabledTypes || !enabledTypes.length) {
		return;
	}

	var uncleared = true;
	EXTERNAL_GLOBAL_EMOTE_ENDPOINTS.forEach(({ type, url }) => {

		if (enabledTypes.indexOf(type) < 0) {
			return;
		}

		queueRequest({ url, json: true }, util.acceptRequest((error, data) => {
			if (!error) {
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
							util.log(`There are now ${externalGlobalEmotes.length} external global emotes (after ${type})`);
						}
					});
				}
				else if (data.emotes) {
					// BTTV
					externalGlobalEmotes = storeExternalEmotes(
						type, externalGlobalEmotes, data.emotes
					);
					util.log(`There are now ${externalGlobalEmotes.length} external global emotes (after ${type})`);
				}
			}

			else {
				util.warn(
					`Error occurred trying to get external global emoticons (${type}): ` +
					(error && error.message)
				);
			}
		}));
	});
};

const requestExternalChannelEmoticons = function(channel, enabledTypes) {
	if (!enabledTypes || !enabledTypes.length) {
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

			let url = prefix + channelName;

			queueRequest({ url, json: true }, util.acceptRequest((error, data) => {
				if (!error) {
					// Clear it if it wasn't already cleared
					if (uncleared) {
						uncleared = false;
						externalChannelEmotes[channel] = [];
					}

					if (data.sets) {
						// FFZ
						_.forOwn(data.sets, (set) => {
							externalChannelEmotes[channel] = storeExternalEmotes(
								type, externalChannelEmotes[channel], set.emoticons
							);
						});

						util.log(`There are now ${externalChannelEmotes[channel].length} external emotes for ${channel} (after ${type})`);
					}
					else if (data.emotes) {
						// BTTV
						externalChannelEmotes[channel] = storeExternalEmotes(
							type, externalChannelEmotes[channel], data.emotes
						);

						util.log(`There are now ${externalChannelEmotes[channel].length} external emotes for ${channel} (after ${type})`);
					}
				}

				else {

					if (error.message.indexOf("404") >= 0) {
						// We don't care about 404s for channels, fail silently
						return;
					}

					util.warn(
						`Error occurred trying to get external emoticons for ${channel} (${type}): ` +
						(error && error.message)
					);
				}
			}));
		});
	}
};

module.exports = {
	clearExternalEmotesForChannel,
	getExternalEmotesForChannel,
	getExternalGlobalEmotes,
	requestExternalChannelEmoticons,
	requestExternalGlobalEmoticons
};
