const _ = require("lodash");
const qs = require("querystring");
const request = require("request");

const CLIENT_ID = "o1cax9hjz2h9yp1l6f2ph95d440cil";
const KRAKEN_BASE_URI = "https://api.twitch.tv/kraken/";
const CHATDEPOT_BASE_URI = "https://chatdepot.twitch.tv/";

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
	const queryString = qs.stringify(_.extend({ oauth_token: oauthId }, query));
	const url = CHATDEPOT_BASE_URI + commandName + "?" + queryString;
	return request({ url, json: true }, callback);
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


module.exports = {
	chatdepotGetRequest,
	flattenEmoticonImagesData,
	krakenGetRequest
};
