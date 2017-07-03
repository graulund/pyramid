const twitchApi = require("./twitchApi");
const util = require("./util");

var emoticonImages = {};
var cheerData = {};

const ROOM_ID_GLOBAL = 0;

const getEmoticonImages = function(emoteSetsString) {
	return emoticonImages[emoteSetsString] || [];
};

const getCheerData = function(roomId) {
	// pass ROOM_ID_GLOBAL for global cheer data
	return cheerData[roomId] || [];
};

const requestEmoticonImages = function(emotesets) {
	util.log(`Requesting emoticon images for ${emotesets}`);
	twitchApi.krakenGetRequest(
		"chat/emoticon_images",
		{ emotesets },
		util.acceptRequest((error, data) => {
			if (!error) {
				emoticonImages[emotesets] =
					twitchApi.flattenEmoticonImagesData(data);

				util.log(`There are now ${emoticonImages[emotesets].length} emoticon images for ${emotesets}`);
			}

			else {
				util.warn(
					"Error occurred trying to request emoticon images from the Twitch API: " +
					(error && error.message)
				);
			}
		})
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
	util.log("Reloading emoticon images...");
	const queries = Object.keys(emoticonImages);
	queries.forEach((emotesets) => {
		requestEmoticonImages(emotesets);
	});
};

const requestGlobalBadgeData = function(callback) {
	util.log("Requesting global channel badge data");
	twitchApi.badgeGetRequest(
		"global/display",
		util.acceptRequest((error, data) => {
			if (!error) {
				callback(data);
			}

			else {
				util.warn(
					"Error occurred trying to request global badge data from the Twitch API: " +
					(error && error.message)
				);
			}
		})
	);
};

const requestChannelBadgeData = function(roomId, callback) {
	util.log(`Requesting channel badge data for ${roomId}`);
	twitchApi.badgeGetRequest(
		`channels/${roomId}/display`,
		util.acceptRequest((error, data) => {
			if (!error) {
				callback(data);
			}

			else {
				util.warn(
					"Error occurred trying to request channel badge data from the Twitch API: " +
					(error && error.message)
				);
			}
		})
	);
};

const requestGlobalCheerData = function() {
	util.log("Requesting global cheer data");
	twitchApi.krakenGetRequest(
		"bits/actions",
		{},
		util.acceptRequest((error, data) => {
			if (!error) {
				cheerData[ROOM_ID_GLOBAL] =
					twitchApi.flattenCheerData(data);

				util.log(`There are now ${cheerData[ROOM_ID_GLOBAL].length} cheer types in the global cheer data`);
			}

			else {
				util.warn(
					"Error occurred trying to request cheer data from the Twitch API: " +
					(error && error.message)
				);
			}
		})
	);
};

const requestChannelCheerData = function(roomId) {
	util.log(`Requesting channel cheer data for ${roomId}`);
	twitchApi.krakenGetRequest(
		"bits/actions",
		{ channel_id: roomId },
		util.acceptRequest((error, data) => {
			if (!error) {
				cheerData[roomId] =
					twitchApi.flattenCheerData(data, cheerData[ROOM_ID_GLOBAL]);

				util.log(`There are now ${cheerData[roomId].length} cheer types in ${roomId}`);
			}

			else {
				util.warn(
					"Error occurred trying to request cheer data from the Twitch API: " +
					(error && error.message)
				);
			}
		})
	);
};

module.exports = {
	getEmoticonImages,
	getCheerData,
	reloadEmoticonImages,
	requestChannelBadgeData,
	requestChannelCheerData,
	requestEmoticonImages,
	requestEmoticonImagesIfNeeded,
	requestGlobalBadgeData,
	requestGlobalCheerData
};
