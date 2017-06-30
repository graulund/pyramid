const _ = require("lodash");
const qs = require("querystring");

const { queueRequest } = require("./httpRequests");

const CLIENT_ID = "o1cax9hjz2h9yp1l6f2ph95d440cil";
const KRAKEN_BASE_URI = "https://api.twitch.tv/kraken/";
const CHATDEPOT_BASE_URI = "https://chatdepot.twitch.tv/";
const BADGE_BASE_URI = "https://badges.twitch.tv/v1/badges/";

const clientIdRequest = function(url, callback, extraOptions = {}) {
	const options = _.merge(
		{
			url,
			headers: {
				"Client-ID": CLIENT_ID
			},
			json: true
		},
		extraOptions
	);

	return queueRequest(options, callback);
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
	const queryString = qs.stringify(_.extend({ oauth_token: oauthId }, query));
	const url = CHATDEPOT_BASE_URI + commandName + "?" + queryString;
	return queueRequest({ url, json: true }, callback);
};

const badgeGetRequest = function(commandString, callback) {
	let url = BADGE_BASE_URI + commandString;
	return queueRequest({ url, json: true }, callback);
};

const flattenEmoticonImagesData = function(data) {
	if (data && data.emoticon_sets) {
		const obj = data.emoticon_sets;
		var ids = [], list = [];
		_.forOwn(obj, (emotes) => {
			if (emotes && emotes.length) {
				emotes.forEach((emote) => {
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

const flattenCheerData = function(data, globalCheersList = null) {
	if (data && data.actions && data.actions.length) {

		// Sort by priority
		let list = data.actions.sort((a, b) => a.priority - b.priority);

		if (globalCheersList && list.length) {
			// Weed out those in the global list
			globalCheersList.forEach((globalCheer) => {
				for (var i = list.length - 1; i >= 0; i--) {
					let cheer = list[i];

					if (cheer.prefix === globalCheer.prefix) {
						list.splice(i, 1);
					}
				}
			});
		}

		// Make sure tiers in each cheer type are sorted
		list.forEach((c) => {
			if (c.tiers && c.tiers.length) {
				c.tiers.sort((a, b) => a.min_bits - b.min_bits);
			}
		});

		return list;
	}

	return [];
};

module.exports = {
	badgeGetRequest,
	chatdepotGetRequest,
	flattenCheerData,
	flattenEmoticonImagesData,
	krakenGetRequest
};
