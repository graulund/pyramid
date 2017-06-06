import { CATEGORY_NAMES, ROOT_PATHNAME } from "../constants";
import { parseChannelUri } from "./channelNames";

export function internalUrl(url) {
	return ROOT_PATHNAME + url;
}

export const homeUrl = ROOT_PATHNAME + "/";

export function userUrl(userName, logDate, pageNumber) {
	return internalUrl(
		"/user/" + userName +
		(logDate ? "/log/" + logDate : "") +
		(pageNumber > 1 ? "/page/" + pageNumber : "")
	);
}

export function channelUrl(channelUri, logDate, pageNumber, encode = true) {
	if (encode) {
		let uriData = parseChannelUri(channelUri);

		if (uriData) {
			channelUri = encodeURIComponent(uriData.server) + "/" +
				encodeURIComponent(uriData.channel);
		}
	}

	return internalUrl(
		"/channel/" + channelUri +
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
	const subjectUrlName = type === "category"
		? query
		: subjectName(type, query, "/");

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
	const [ type, query ] = subject.split(delimiter);
	return { type, query };
}
