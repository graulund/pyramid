const _ = require("lodash");

const emoteParsing = require("./emoteParsing");
const twitchApiData = require("./twitchApiData");
const userStates = require("./userStates");

const USER_STATE_MESSAGE_FIELDS = [
	"badges", "color", "display-name", "mod", "subscriber", "turbo",
	"user-id", "user-type"
];

const populateLocallyPostedTags = function(tags, serverName, channel, message) {
	if (tags) {
		let globalState = userStates.getGlobalUserState(serverName) || {};
		let localState = userStates.getUserState(channel) || userStates.getAverageUserState();

		_.assign(
			tags,
			_.pick(globalState, USER_STATE_MESSAGE_FIELDS),
			_.pick(localState, USER_STATE_MESSAGE_FIELDS),
			{
				emotes: emoteParsing.generateEmoticonIndices(
						message,
						twitchApiData.getEmoticonImages(
							localState["emote-sets"] ||
							globalState["emote-sets"]
						)
					)
			}
		);
	}
};

const prepareEmotesInMessage = function(message, externalEmotes, cheerData) {
	let {
		channel,
		message: messageText,
		meUsername,
		postedLocally,
		serverName,
		tags,
		username
	} = message;

	if (tags.emotes) {
		// Parse emoticon indices supplied by Twitch
		if (typeof tags.emotes === "string") {
			tags.emotes = emoteParsing.parseEmoticonIndices(
				tags.emotes
			);
		}
	}
	else if (postedLocally && username === meUsername) {
		// We posted this message, populate emotes
		populateLocallyPostedTags(
			tags, serverName, channel, messageText
		);
	}
	else if ("emotes" in tags) {
		// Type normalization
		tags.emotes = [];
	}

	let emotes = tags.emotes || [];

	// Add cheers
	if (tags.bits) {
		let cheers = emoteParsing.generateCheerIndices(
			messageText, cheerData, emotes
		);

		if (cheers) {
			tags.cheers = cheers;
		}
	}

	// Add external emotes
	tags.emotes = emoteParsing.generateEmoticonIndices(
		messageText, externalEmotes, emotes
	);
};

module.exports = {
	prepareEmotesInMessage
};
