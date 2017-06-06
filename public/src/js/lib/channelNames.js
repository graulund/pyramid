const CHANNEL_URI_SEPARATOR = "/";

export function getChannelUri(channelName, serverName) {
	serverName = "" + serverName;
	channelName = "" + channelName;

	return serverName.replace(/\//g, "") +
		CHANNEL_URI_SEPARATOR +
		channelName;
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

export function channelNameFromUrl(url) {
	if (url && url.replace) {
		return url.replace(/^[^\/]+\//, "#");
	}

	return null;
}

export function channelServerNameFromUrl(url) {
	var m;
	if (url && url.match && (m = url.match(/^([^\/]+)\//)) && m[1]) {
		return m[1];
	}

	return null;
}

export function channelUrlFromNames(server, channel) {
	return server + "/" + channel;
}

export function getChannelDisplayNameFromState(state, channel) {

	if (!channel) {
		return;
	}

	let [ serverName, channelName ] = channel.split(/\//);
	let config = state.ircConfigs[serverName];
	let setting = state.appConfig.enableTwitchChannelDisplayNames;

	if (setting && config) {
		let channelConfig = config.channels[channelName];
		if (channelConfig) {
			return channelConfig.displayName;
		}
	}
}
