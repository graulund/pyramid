import { CHANNEL_TYPES, TWITCH_DISPLAY_NAMES } from "../constants";
import { parseChannelUri } from "./channelNames";
import { getUserInfo } from "./users";

export const DISPLAY_NAME_PREFIX_TYPES = {
	NONE: 0,
	DEFAULT: 1,
	LOWERCASE: 2
};

export function getTwitchUserDisplayNameData(
	username, displayName, usersEnabled = false
) {
	var primary = username, secondary, tooltip;

	if (usersEnabled && displayName && displayName !== username) {
		if (displayName.toLowerCase() !== username.toLowerCase()) {
			// Totally different altogether
			if (usersEnabled === TWITCH_DISPLAY_NAMES.ALL) {
				primary = displayName;
				secondary = username;
				tooltip = username;
			}
		}
		else {
			// Merely case changes
			primary = displayName;
		}
	}

	return { primary, secondary, tooltip };
}

export function getTwitchChannelDisplayNameData(
	channelName, displayName, channelsEnabled = false, usersEnabled = false
) {

	if (channelName[0] !== "#") {
		channelName = "#" + channelName;
	}

	var primary = channelName, tooltip;
	let twitchChannelIsUser = channelName.substr(0,2) !== "#_";

	// If displaying display name

	if (
		channelsEnabled &&
		displayName &&
		displayName !== channelName
	) {
		// Different behaviour if it's a user versus a group chat
		if (twitchChannelIsUser) {
			return getTwitchUserDisplayNameData(channelName, displayName, usersEnabled);
		}
		else {
			if (displayName.toLowerCase() !== channelName.toLowerCase()) {
				// Totally different altogether
				// Note the absence of secondary; that's only for usernames
				primary = displayName;
				tooltip = channelName;
			}
			else {
				primary = displayName;
			}
		}
	}

	return { primary, secondary: undefined, tooltip };
}

function displayNameStringFromData(data) {
	let { primary, secondary } = data;

	if (primary && secondary) {
		return `${primary} (${secondary})`;
	}

	return primary;
}

export function getTwitchUserDisplayNameString(
	username, displayName, usersEnabled = false
) {
	return displayNameStringFromData(getTwitchUserDisplayNameData(
		username, displayName, usersEnabled
	));
}

export function getTwitchChannelDisplayNameString(
	channelName, displayName, channelsEnabled = false, usersEnabled = false
) {
	return displayNameStringFromData(getTwitchChannelDisplayNameData(
		channelName, displayName, channelsEnabled, usersEnabled
	));
}

function _getConversationData(
	uriData,
	usersEnabled = false,
	userDisplayNames = {}
) {

	let { channel, channelType, server } = uriData;

	if (!server || channelType !== CHANNEL_TYPES.PRIVATE) {
		return null;
	}

	const otherParticipant = channel;

	var otherDisplayName;

	if (usersEnabled) {
		if (otherParticipant in userDisplayNames) {
			// Look up in given data instead of consulting the store
			// Even if a falsy value is supplied, it's accepted; it's then seen
			// as a guarantee that this person does not have a display name

			otherDisplayName = userDisplayNames[otherParticipant];
		}

		else {
			// TODO: What about users not in the friends list?
			// TODO: Disambiguate per server

			let userInfo = getUserInfo(otherParticipant);
			otherDisplayName = userInfo && userInfo.displayName;
		}
	}

	return {
		server,
		userDisplayName: otherDisplayName,
		username: otherParticipant,
	};
}

export function getConversationPrefix(
	prefixType = DISPLAY_NAME_PREFIX_TYPES.DEFAULT
) {
	var prefix;

	switch (prefixType) {
		case DISPLAY_NAME_PREFIX_TYPES.NONE:
			prefix = "";
			break;
		case DISPLAY_NAME_PREFIX_TYPES.LOWERCASE:
			prefix = "conversation with ";
			break;
		default:
			prefix = "Conversation with ";
			break;
	}

	return prefix;
}

function _getConversationName(
	uriData,
	prefixType = DISPLAY_NAME_PREFIX_TYPES.DEFAULT,
	usersEnabled = false,
	userDisplayNames = {}
) {

	if (uriData.channelType !== CHANNEL_TYPES.PRIVATE) {
		return "";
	}

	let conversationData = _getConversationData(
		uriData, usersEnabled, userDisplayNames
	);

	if (!conversationData) {
		return "";
	}

	let { server, userDisplayName, username } = conversationData;

	let prefix = getConversationPrefix(prefixType);

	let otherDisplayName = getTwitchUserDisplayNameString(
		username,
		userDisplayName,
		usersEnabled
	);

	return prefix + otherDisplayName + " on " + server;

}

export function getConversationName(
	channelUri,
	prefixType = DISPLAY_NAME_PREFIX_TYPES.DEFAULT,
	usersEnabled = false,
	userDisplayNames = {}
) {
	let uriData = typeof channelUri === "string"
		? parseChannelUri(channelUri)
		: channelUri;

	return _getConversationName(
		uriData, prefixType, usersEnabled, userDisplayNames
	);
}

export function getConversationData(
	channelUri, usersEnabled = false, userDisplayNames = {}
) {
	let uriData = typeof channelUri === "string"
		? parseChannelUri(channelUri)
		: channelUri;

	return _getConversationData(
		uriData, usersEnabled, userDisplayNames
	);
}

export function getChannelDisplayString(channelUri, options = {}) {
	let uriData = parseChannelUri(channelUri);

	// Private conversation

	if (uriData.channelType === CHANNEL_TYPES.PRIVATE) {
		let conversationName = _getConversationName(
			uriData,
			options.prefixType,
			options.enableTwitchUserDisplayNames,
			options.userDisplayNames
		);

		return conversationName;
	}

	// Public channel

	return getTwitchChannelDisplayNameString(
		uriData.channel,
		options.displayName,
		options.enableTwitchChannelDisplayNames,
		options.enableTwitchUserDisplayNames
	);
}
