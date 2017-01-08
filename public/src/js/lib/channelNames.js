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
