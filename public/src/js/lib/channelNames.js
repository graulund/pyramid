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

	let server = channelUri.substr(0, separatorLocation);
	let channel = channelUri.substr(
		separatorLocation + CHANNEL_URI_SEPARATOR.length
	);

	return { channel, server };
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
