const CHANNEL_URI_SEPARATOR = "/";

const getChannelUri = function(channelName, serverName) {
	serverName = "" + serverName;
	channelName = "" + channelName;

	return serverName.replace(/\//g, "") +
		CHANNEL_URI_SEPARATOR +
		channelName.replace(/^#/, "");
};

const parseChannelUri = function(channelUri) {
	let separatorLocation = channelUri.indexOf(CHANNEL_URI_SEPARATOR);

	if (separatorLocation < 0) {
		return null;
	}

	let server = channelUri.substr(0, separatorLocation);
	let channel = channelUri.substr(
		separatorLocation + CHANNEL_URI_SEPARATOR.length
	);

	return { channel, server };
};

const channelNameFromUrl = function(url, prefix = "") {
	// Deprecated
	if (url && url.replace) {
		return url.replace(/^[^\/]+\//, prefix);
	}

	return null;
};

const channelServerNameFromUrl = function(url) {
	// Deprecated
	var m;
	if (url && url.match && (m = url.match(/^([^\/]+)\//)) && m[1]) {
		return m[1];
	}

	return null;
};

const channelUriFromNames = function(server, channel) {
	// Deprecated
	return getChannelUri(channel, server);
};

const passesChannelWhiteBlacklist = function(target, channelUri) {
	const uriData = parseChannelUri(channelUri);

	if (uriData && target) {
		let { channel, server } = uriData;

		// If there is a white list, and we're not on it, return false
		if (
			target.channelWhitelist &&
			target.channelWhitelist.length &&
			target.channelWhitelist.indexOf(channel) < 0
		) {
			return false;
		}

		// If we're on the blacklist, return false
		if (
			target.channelBlacklist &&
			target.channelBlacklist.indexOf(channel) >= 0
		) {
			return false;
		}

		// Same for servers

		if (
			target.serverWhitelist &&
			target.serverWhitelist.length &&
			target.serverWhitelist.indexOf(server) < 0
		) {
			return false;
		}

		if (
			target.serverBlacklist &&
			target.serverBlacklist.indexOf(server) >= 0
		) {
			return false;
		}
	}

	return true;
};

module.exports = {
	channelNameFromUrl,
	channelServerNameFromUrl,
	channelUriFromNames,
	getChannelUri,
	parseChannelUri,
	passesChannelWhiteBlacklist
};
