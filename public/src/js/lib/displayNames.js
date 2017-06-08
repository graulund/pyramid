import { TWITCH_DISPLAY_NAMES } from "../constants";

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
