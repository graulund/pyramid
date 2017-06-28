const twitchApi = require("./twitchApi");
const util = require("./util");

var emoticonImages = {};

const getEmoticonImages = function(emoteSetsString) {
	return emoticonImages[emoteSetsString];
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
					"Error occurred trying to request emoticon images from the Twitch API\n",
					error
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


module.exports = {
	getEmoticonImages,
	reloadEmoticonImages,
	requestEmoticonImages,
	requestEmoticonImagesIfNeeded
};
