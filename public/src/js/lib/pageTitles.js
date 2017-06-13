import { CATEGORY_NAMES, SETTINGS_PAGE_NAMES } from "../constants";
import { channelNameFromUri } from "./channelNames";
import { getTwitchChannelDisplayNameString, getTwitchUserDisplayNameString } from "./displayNames";
import { getChannelInfo } from "./ircConfigs";
import * as route from "./routeHelpers";
import store from "../store";

var currentPathname = "";
var currentTitle = "";
var currentUnseenNumber = 0;
var userDisplayNameSetting = 0;
var channelDisplayNameSetting = false;

var oldIrcConfigCount = 0;
var oldLastSeenUsersCount = 0;

function siteTitle(pageTitle = "") {
	if (pageTitle) {
		return `${pageTitle} | Pyramid`;
	}

	return "Pyramid";
}

function logTitle(date, title) {
	return `${date} log of ` + title;
}

function channelDisplayNameString(name, displayName) {
	return getTwitchChannelDisplayNameString(
		name,
		displayName,
		channelDisplayNameSetting,
		userDisplayNameSetting
	);
}

function userDisplayNameString(name, displayName) {
	return getTwitchUserDisplayNameString(
		name,
		displayName,
		userDisplayNameSetting
	);
}

function channelPageTitle(channelInfo) {
	return siteTitle(
		channelDisplayNameString(
			channelNameFromUri(channelInfo.channel),
			channelInfo.displayName
		)
	);
}

function userPageTitle(user) {
	return siteTitle(userDisplayNameString(user.username, user.displayName));
}

function channelPageLogTitle(channelInfo, date) {
	return siteTitle(logTitle(
		date,
		channelDisplayNameString(
			channelNameFromUri(channelInfo.channel),
			channelInfo.displayName
		)
	));
}

function userPageLogTitle(user, date) {
	return siteTitle(logTitle(
		date, userDisplayNameString(user.username, user.displayName)
	));
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

function setUserDisplayNameSetting(setting) {
	userDisplayNameSetting = setting;
	reloadTitle();
}

function setChannelDisplayNameSetting(setting) {
	channelDisplayNameSetting = setting;
	reloadTitle();
}

function commitTitle() {
	const prefix = currentUnseenNumber > 0 ? `(${currentUnseenNumber}) ` : "";
	document.title = prefix + currentTitle;
}

function getUserInfo(username) {
	let state = store.getState();
	return { username, ...state.lastSeenUsers[username] };
}

function handleLocationChange(location) {
	const { pathname } = location;
	currentPathname = pathname;

	var m = route.parseChannelLogUrl(pathname);

	if (m) {
		setTitle(channelPageLogTitle(getChannelInfo(m[1]), m[2]));
		return;
	}

	m = route.parseUserLogUrl(pathname);

	if (m) {
		setTitle(userPageLogTitle(getUserInfo(m[1]), m[2]));
		return;
	}

	m = route.parseChannelUrl(pathname);

	if (m) {
		setTitle(channelPageTitle(getChannelInfo(m[1])));
		return;
	}

	m = route.parseUserUrl(pathname);

	if (m) {
		setTitle(userPageTitle(getUserInfo(m[1])));
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

function reloadTitle() {
	handleLocationChange({ pathname: currentPathname });
}

store.subscribe(function() {
	let state = store.getState();
	let { appConfig, ircConfigs, lastSeenUsers, unseenHighlights } = state;

	// When the unseen number changes

	let unseenNumber = unseenHighlights && unseenHighlights.length || 0;
	if (unseenNumber !== currentUnseenNumber) {
		setUnseenNumber(unseenNumber);
	}

	// When the settings change

	let {
		enableTwitchChannelDisplayNames,
		enableTwitchUserDisplayNames
	} = appConfig;

	if (channelDisplayNameSetting !== enableTwitchChannelDisplayNames) {
		setChannelDisplayNameSetting(enableTwitchChannelDisplayNames);
	}

	if (userDisplayNameSetting !== enableTwitchUserDisplayNames) {
		setUserDisplayNameSetting(enableTwitchUserDisplayNames);
	}

	// Once data loads

	let ircConfigCount = Object.keys(ircConfigs).length;
	let lastSeenUsersCount = Object.keys(lastSeenUsers).length;

	if (!oldIrcConfigCount && ircConfigCount) {
		reloadTitle();
		oldIrcConfigCount = ircConfigCount;
	}

	if (!oldLastSeenUsersCount && lastSeenUsersCount) {
		reloadTitle();
		oldLastSeenUsersCount = lastSeenUsersCount;
	}
});

export default function setUpPageTitles(history) {
	history.listen(handleLocationChange);
	handleLocationChange(location);
}
