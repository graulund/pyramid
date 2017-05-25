const getChannelUri = function(channelName, serverName) {

	let safeString = function(str) {
		if (!str) {
			return "";
		}

		return str.replace(/[^a-zA-Z0-9_-]+/g, "");
	};

	let c = safeString(channelName);

	if (serverName) {
		return safeString(serverName) + "/" + c;
	}

	return c;
};

const channelNameFromUrl = function(url, prefix = "") {
	if (url && url.replace) {
		return url.replace(/^[^\/]+\//, prefix);
	}

	return null;
};

const channelServerNameFromUrl = function(url) {
	var m;
	if (url && url.match && (m = url.match(/^([^\/]+)\//)) && m[1]) {
		return m[1];
	}

	return null;
};

const channelUriFromNames = function(server, channel) {
	// TODO: Deprecate
	return getChannelUri(channel, server);
};

const passesChannelWhiteBlacklist = function(target, channelUri) {

	const segs = channelUri.toLowerCase().split("/");
	const server = segs[0], channel = segs[1];

	if (target) {

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
	passesChannelWhiteBlacklist
};
