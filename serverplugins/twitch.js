// PYRAMID
// Twitch support

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

module.exports = {
	onConnect,
	onMessageTags
};
