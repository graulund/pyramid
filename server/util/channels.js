const CHANNEL_URI_SEPARATOR = "/";

const getChannelUri = function(server, channel) {
	return server.replace(/\//g, "") +
		CHANNEL_URI_SEPARATOR +
		channel.replace(/^#/, "");

	// TODO: Stripping the # character should happen another place, to prevent it from happening more than once
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

const channelNameFromUri = function(channelUri, prefix = "") {
	let uriData = parseChannelUri(channelUri);

	if (uriData && uriData.channel) {
		return prefix + uriData.channel;
	}

	return null;
};

const serverNameFromChannelUri = function(channelUri) {
	let uriData = parseChannelUri(channelUri);

	if (uriData && uriData.server) {
		return uriData.server;
	}

	return null;
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
	channelNameFromUri,
	serverNameFromChannelUri,
	getChannelUri,
	parseChannelUri,
	passesChannelWhiteBlacklist
};
