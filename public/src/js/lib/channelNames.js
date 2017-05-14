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
	return server + "/" + channel.replace(/^#/, "");
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
