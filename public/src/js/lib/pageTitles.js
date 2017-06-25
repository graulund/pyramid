import { CATEGORY_NAMES, SETTINGS_PAGE_NAMES } from "../constants";
import { getPrivateConversationUri } from "./channelNames";
import { getChannelDisplayString, getTwitchUserDisplayNameString } from "./displayNames";
import { getChannelInfo, getMyNickname } from "./ircConfigs";
import { getUserInfo } from "./users";
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

function channelDisplayNameString(channel, displayName) {
	return getChannelDisplayString(channel, {
		displayName,
		enableTwitchChannelDisplayNames: channelDisplayNameSetting,
		enableTwitchUserDisplayNames: userDisplayNameSetting
	});
}

function userDisplayNameString(name, displayName) {
	return getTwitchUserDisplayNameString(
		name,
		displayName,
		userDisplayNameSetting
	);
}

function channelPageTitle(channelInfo) {
	let { channel, displayName } = channelInfo;
	return siteTitle(channelDisplayNameString(channel, displayName));
}

function userPageTitle(user) {
	let { displayName, username } = user;
	return siteTitle(userDisplayNameString(username, displayName));
}

function channelPageLogTitle(channelInfo, date) {
	let { channel, displayName } = channelInfo;

	return siteTitle(logTitle(
		date, channelDisplayNameString(channel, displayName)
	));
}

function userPageLogTitle(user, date) {
	let { displayName, username } = user;

	return siteTitle(logTitle(
		date, userDisplayNameString(username, displayName)
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

function getConversationUri(serverName, participantName) {
	let myNick = getMyNickname(serverName);

	if (myNick) {
		return getPrivateConversationUri(serverName, myNick, participantName);
	}

	return null;
}

function handleLocationChange(location) {
	const { pathname } = location;
	currentPathname = pathname;

	// Log URLs

	var m = route.parseChannelLogUrl(pathname);

	if (m) {
		let channelInfo = getChannelInfo(m[1]);
		if (channelInfo) {
			setTitle(channelPageLogTitle(channelInfo, m[2]));
			return;
		}
	}

	m = route.parseUserLogUrl(pathname);

	if (m) {
		let userInfo = getUserInfo(m[1]);
		if (userInfo) {
			setTitle(userPageLogTitle(userInfo, m[2]));
			return;
		}
	}

	m = route.parseConversationLogUrl(pathname);

	if (m) {
		let channel = getConversationUri(m[1], m[2]);
		if (channel) {
			setTitle(channelPageLogTitle({ channel }, m[3]));
			return;
		}
	}

	// Live URLs

	m = route.parseChannelUrl(pathname);

	if (m) {
		let channelInfo = getChannelInfo(m[1]);
		if (channelInfo) {
			setTitle(channelPageTitle(channelInfo));
			return;
		}
	}

	m = route.parseUserUrl(pathname);

	if (m) {
		let userInfo = getUserInfo(m[1]);
		if (userInfo) {
			setTitle(userPageTitle(userInfo));
			return;
		}
	}

	m = route.parseConversationUrl(pathname);

	if (m) {
		let channel = getConversationUri(m[1], m[2]);
		if (channel) {
			setTitle(channelPageTitle({ channel }));
			return;
		}
	}

	// Utility URLs

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
