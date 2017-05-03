import { CATEGORY_NAMES, SETTINGS_PAGE_NAMES } from "../constants";
import { channelNameFromUrl } from "./channelNames";
import * as route from "./routeHelpers";
import store from "../store";

var currentTitle = "";
var currentUnseenNumber = 0;

function siteTitle(pageTitle = "") {
	if (pageTitle) {
		return `${pageTitle} | Pyramid`;
	}

	return "Pyramid";
}

function logTitle(date, title) {
	return `${date} log of ` + title;
}

function channelPageTitle(channel) {
	return siteTitle(channelNameFromUrl(channel));
}

function userPageTitle(username) {
	return siteTitle(username);
}

function channelPageLogTitle(channel, date) {
	return siteTitle(logTitle(date, channelNameFromUrl(channel)));
}

function userPageLogTitle(username, date) {
	return siteTitle(logTitle(date, username));
}

function categoryPageTitle(categoryName) {
	return siteTitle(CATEGORY_NAMES[categoryName]);
}

function settingsPageTitle(pageName) {
	const name = pageName !== "general"
		? SETTINGS_PAGE_NAMES[pageName] : "";

	return siteTitle("Settings" + (name ? ": " + name : ""));
}

function setTitle(title) {
	currentTitle = title;
	commitTitle();
}

function setUnseenNumber(unseenNumber) {
	currentUnseenNumber = unseenNumber;
	commitTitle();
}

function commitTitle() {
	const prefix = currentUnseenNumber > 0 ? `(${currentUnseenNumber}) ` : "";
	document.title = prefix + currentTitle;
}

function handleLocationChange(location) {
	const { pathname } = location;

	var m = route.parseChannelLogUrl(pathname);

	if (m) {
		setTitle(channelPageLogTitle(m[1], m[2]));
		return;
	}

	m = route.parseUserLogUrl(pathname);

	if (m) {
		setTitle(userPageLogTitle(m[1], m[2]));
		return;
	}

	m = route.parseChannelUrl(pathname);

	if (m) {
		setTitle(channelPageTitle(m[1]));
		return;
	}

	m = route.parseUserUrl(pathname);

	if (m) {
		setTitle(userPageTitle(m[1]));
		return;
	}

	m = route.parseSettingsUrl(pathname);

	if (m) {
		setTitle(settingsPageTitle(m[2]));
		return;
	}

	m = route.parseCategoryUrl(pathname);

	if (m) {
		setTitle(categoryPageTitle(m[1]));
		return;
	}

	// Fallback
	setTitle(siteTitle());
}

store.subscribe(function() {
	const state = store.getState();
	const unseenNumber =
		state.unseenHighlights && state.unseenHighlights.length || 0;
	if (unseenNumber !== currentUnseenNumber) {
		setUnseenNumber(unseenNumber);
	}
});

export default function setUpPageTitles(history) {
	history.listen(handleLocationChange);
	handleLocationChange(location);
}
