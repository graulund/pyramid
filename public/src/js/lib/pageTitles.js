import { CATEGORY_NAMES, SETTINGS_PAGE_NAMES, TWITCH_DISPLAY_NAMES } from "../constants";
import { channelNameFromUrl } from "./channelNames";
import * as route from "./routeHelpers";
import store from "../store";

var currentTitle = "";
var currentUnseenNumber = 0;
var userDisplayNameSetting = 0;
var channelDisplayNameSetting = false;

function siteTitle(pageTitle = "") {
	if (pageTitle) {
		return `${pageTitle} | Pyramid`;
	}

	return "Pyramid";
}

function logTitle(date, title) {
	return `${date} log of ` + title;
}

function combinedDisplayName(name, displayName) {
	if (userDisplayNameSetting && displayName && displayName !== name) {
		if (displayName.toLowerCase() !== name.toLowerCase()) {
			// Totally different altogether
			if (userDisplayNameSetting === TWITCH_DISPLAY_NAMES.ALL) {
				return `${displayName} (${name})`;
			}
		}
		else {
			// Merely case changes
			return displayName;
		}
	}

	return name;
}

function channelPageTitle(channelInfo) {
	return siteTitle(
		(channelDisplayNameSetting && channelInfo.displayName) ||
		channelNameFromUrl(channelInfo.channel)
	);
}

function userPageTitle(user) {
	return siteTitle(combinedDisplayName(user.username, user.displayName));
}

function channelPageLogTitle(channelInfo, date) {
	return siteTitle(logTitle(
		date,
		(channelDisplayNameSetting && channelInfo.displayName) ||
		channelNameFromUrl(channelInfo.channel)
	));
}

function userPageLogTitle(user, date) {
	return siteTitle(logTitle(
		date, combinedDisplayName(user.username, user.displayName)
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

function commitTitle() {
	const prefix = currentUnseenNumber > 0 ? `(${currentUnseenNumber}) ` : "";
	document.title = prefix + currentTitle;
}

function getUserInfo(username) {
	let state = store.getState();
	return { username, ...state.lastSeenUsers[username] };
}

function getChannelInfo(channel) {
	let state = store.getState();
	let [ serverName, channelName ] = channel.split(/\//);
	let config = state.ircConfigs[serverName];
	let setting = state.appConfig.enableTwitchChannelDisplayNames;

	var channelConfig = {};

	if (setting && config) {
		channelConfig = config.channels[channelName];
	}

	return { channel, ...channelConfig };
}

function handleLocationChange(location) {
	const { pathname } = location;

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

store.subscribe(function() {
	const state = store.getState();
	const unseenNumber =
		state.unseenHighlights && state.unseenHighlights.length || 0;
	if (unseenNumber !== currentUnseenNumber) {
		setUnseenNumber(unseenNumber);
	}

	userDisplayNameSetting = state.appConfig.enableTwitchUserDisplayNames;
	channelDisplayNameSetting = state.appConfig.enableTwitchChannelDisplayNames;
});

export default function setUpPageTitles(history) {
	history.listen(handleLocationChange);
	handleLocationChange(location);
}
