import { CHANNEL_TYPES } from "../constants";

const CHANNEL_URI_SEPARATOR = "/";

export function getChannelUri(server, channel) {
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

	let out = { channel, channelType, server };

	if (channelType === CHANNEL_TYPES.PRIVATE) {
		out.participants = channel.split(",");
	}

	return out;
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

export function getPrivateConversationUri(serverName, username1, username2) {
	let usernames = [username1, username2];
	usernames.sort();

	return `private:${serverName}/${usernames.join(",")}`;
}

export function getChannelDisplayNameFromState(state, channelUri) {
	if (!channelUri) {
		return "";
	}

	let uriData = parseChannelUri(channelUri);

	if (!uriData) {
		return "";
	}

	let { channel, server } = uriData;

	let config = state.ircConfigs[server];
	let setting = state.appConfig.enableTwitchChannelDisplayNames;

	if (setting && config) {
		let channelConfig = config.channels[channel];
		if (channelConfig) {
			return channelConfig.displayName;
		}
	}
}
