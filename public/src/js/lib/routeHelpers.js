import { CHANNEL_TYPES, CATEGORY_NAMES, ROOT_PATHNAME } from "../constants";
import { getPrivateConversationUri, parseChannelUri } from "./channelNames";

export function internalUrl(url) {
	return ROOT_PATHNAME + url;
}

export const homeUrl = ROOT_PATHNAME + "/";

export function userUrl(username, logDate, pageNumber, encode = true) {
	return internalUrl(
		"/user/" + (encode ? encodeURIComponent(username) : username) +
		(logDate ? "/log/" + logDate : "") +
		(pageNumber > 1 ? "/page/" + pageNumber : "")
	);
}

export function channelUrl(channel, logDate, pageNumber, encode = true) {
	if (encode) {
		let uriData = parseChannelUri(channel);

		if (uriData) {
			channel = encodeURIComponent(uriData.server) + "/" +
				encodeURIComponent(uriData.channel);
		}
	}

	return internalUrl(
		"/channel/" + channel +
		(logDate ? "/log/" + logDate : "") +
		(pageNumber > 1 ? "/page/" + pageNumber : "")
	);
}

export function conversationUrl(serverName, username, logDate, pageNumber, encode = true) {
	var name;

	if (encode) {
		name = encodeURIComponent(serverName) + "/" +
			encodeURIComponent(username);
	}

	else {
		name = serverName + "/" + username;
	}

	return internalUrl(
		"/conversation/" + name +
		(logDate ? "/log/" + logDate : "") +
		(pageNumber > 1 ? "/page/" + pageNumber : "")
	);
}

export function categoryUrl(categoryName) {
	return internalUrl(
		"/" + categoryName
	);
}

export function subjectUrl(type, query, logDate, pageNumber) {

	var subjectUrlName;

	if (type === "category") {
		subjectUrlName = query;
	}

	else {
		if (type === "channel" && query.indexOf(":") >= 0) {
			// Parse URI fully
			let uriData = parseChannelUri(query);

			// Private channel exception
			if (uriData && uriData.channelType === CHANNEL_TYPES.PRIVATE) {
				let { channel, server } = uriData;
				return conversationUrl(
					server, channel, logDate, pageNumber
				);
			}
			// Otherwise, use default
		}

		subjectUrlName = subjectName(type, query, "/");
	}

	return internalUrl(
		"/" + subjectUrlName +
		(logDate ? "/log/" + logDate : "") +
		(pageNumber > 1 ? "/page/" + pageNumber : "")
	);
}

export function settingsUrl(settingsPageName) {

	if (settingsPageName === "general") {
		settingsPageName = "";
	}

	return internalUrl(
		"/settings" +
		(settingsPageName ? "/" + settingsPageName : "")
	);
}

export function parseUserUrl(pathname) {
	return pathname.match(/^\/user\/([^\/]+)\/?$/);
}

export function parseUserLogUrl(pathname) {
	return pathname.match(/^\/user\/([^\/]+)\/log\/([^\/]+)\/?$/);
}

export function parseChannelUrl(pathname) {
	return pathname.match(/^\/channel\/(.+?)\/?$/);
}

export function parseChannelLogUrl(pathname) {
	return pathname.match(/^\/channel\/(.+?)\/log\/([^\/]+)\/?$/);
}

export function parseConversationUrl(pathname) {
	return pathname.match(/^\/conversation\/([^\/]+)\/([^\/]+)\/?$/);
}

export function parseConversationLogUrl(pathname) {
	return pathname.match(/^\/conversation\/([^\/]+)\/([^\/]+)\/log\/([^\/]+)\/?$/);
}

export function parseCategoryUrl(pathname) {
	var out = null;
	Object.keys(CATEGORY_NAMES).forEach((name) => {
		if (pathname === "/" + name) {
			out = ["/" + name, name];
		}
	});

	return out;
}

export function parseSettingsUrl(pathname) {
	return pathname.match(/^\/settings(\/([^\/]+))?\/?$/);
}

export const settingsPattern = "/settings/:pageName?";

export function parseLineIdHash(hash) {
	const m = hash.match(/^#line-([a-z0-9-]+)$/i);
	if (m && m[1]) {
		return m[1];
	}

	return null;
}

export function createLineIdHash(lineId) {
	return `#line-${lineId}`;
}

export function subjectName(type, query, delimiter = ":") {
	return type + delimiter + query;
}

export function parseSubjectName(subject, delimiter = ":") {
	// Only the first instance of delimiter
	let delimiterPosition = subject.indexOf(delimiter);
	let type = "", query = "";

	if (delimiterPosition >= 0) {
		type = subject.substr(0, delimiterPosition);
		query = subject.substr(1 + delimiterPosition);
	}

	return { type, query };
}

export function getRouteData(pathname) {

	// Log URLs

	var m = parseChannelLogUrl(pathname);

	if (m) {
		return { type: "channel", query: m[1], logDate: m[2] };
	}

	m = parseUserLogUrl(pathname);

	if (m) {
		return { type: "user", query: m[1], logDate: m[2] };
	}

	m = parseConversationLogUrl(pathname);

	if (m) {
		let channel = getPrivateConversationUri(m[1], m[2]);
		return { type: "channel", query: channel, logDate: m[3] };
	}

	// Live URLs

	m = parseChannelUrl(pathname);

	if (m) {
		return { type: "channel", query: m[1] };
	}

	m = parseUserUrl(pathname);

	if (m) {
		return { type: "user", query: m[1] };
	}

	m = parseConversationUrl(pathname);

	if (m) {
		let channel = getPrivateConversationUri(m[1], m[2]);
		return { type: "channel", query: channel };
	}

	// Utility URLs

	m = parseSettingsUrl(pathname);

	if (m) {
		return { type: "settings", query: m[2] };
	}

	m = parseCategoryUrl(pathname);

	if (m) {
		return { type: "category", query: m[1] };
	}

	if (pathname === homeUrl) {
		return { type: "home" };
	}

	return null;
}
