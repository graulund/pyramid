import { CHANNEL_TYPES } from "../constants";

const CHANNEL_URI_SEPARATOR = "/";

export function getChannelUri(server, channel, channelType = CHANNEL_TYPES.PUBLIC) {

	if (channelType === CHANNEL_TYPES.PRIVATE) {
		return getPrivateConversationUri(server, channel);
	}

	return server.replace(/\//g, "") +
		CHANNEL_URI_SEPARATOR +
		channel;
}

export function parseChannelUri(channelUri) {
	let separatorLocation = channelUri.indexOf(CHANNEL_URI_SEPARATOR);

	if (separatorLocation < 0) {
		return null;
	}

	let channelType = CHANNEL_TYPES.PUBLIC;

	if (channelUri.substr(0, 8) === "private:") {
		channelType = CHANNEL_TYPES.PRIVATE;
		channelUri = channelUri.substr(8);
		separatorLocation -= 8;
	}

	let server = channelUri.substr(0, separatorLocation);
	let channel = channelUri.substr(
		separatorLocation + CHANNEL_URI_SEPARATOR.length
	);

	return { channel, channelType, server };
}

export function channelNameFromUri(channelUri, prefix = "") {
	let uriData = parseChannelUri(channelUri);

	if (uriData && uriData.channel) {
		return prefix + uriData.channel;
	}

	return null;
}

export function serverNameFromChannelUri(channelUri) {
	let uriData = parseChannelUri(channelUri);

	if (uriData && uriData.server) {
		return uriData.server;
	}

	return null;
}

export function getPrivateConversationUri(serverName, username) {
	return "private:" + getChannelUri(serverName, username);
}

export function getChannelIrcConfigFromState(state, channelUri) {
	if (!channelUri) {
		return undefined;
	}

	let uriData = parseChannelUri(channelUri);

	if (!uriData) {
		return undefined;
	}

	let { channel, server } = uriData;

	let config = state.ircConfigs[server];
	let setting = state.appConfig.enableTwitchChannelDisplayNames;

	if (setting && config) {
		let channelData = config.channels[channel];
		return channelData;
	}
}

export function getChannelDisplayNameFromState(state, channelUri) {
	let channelData = getChannelIrcConfigFromState(state, channelUri);
	return channelData && channelData.displayName || "";
}
