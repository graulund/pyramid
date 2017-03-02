import { ROOT_PATHNAME } from "../constants";

export function internalUrl(url) {
	return ROOT_PATHNAME + url;
}

export const homeUrl = ROOT_PATHNAME + "/";

export function userUrl(userName, logDate) {
	return internalUrl(
		"/user/" + userName +
		(logDate ? "/log/" + logDate : "")
	);
}

export function channelUrl(channelUri, logDate) {
	return internalUrl(
		"/channel/" + channelUri +
		(logDate ? "/log/" + logDate : "")
	);
}

export function categoryUrl(categoryName) {
	return internalUrl(
		"/" + categoryName
	);
}

export function settingsUrl(settingsPageName) {
	return internalUrl(
		"/settings" +
		(settingsPageName ? "/" + settingsPageName : "")
	);
}

export const settingsPattern = "/settings(/:pageName)";
