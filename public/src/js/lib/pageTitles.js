import { CATEGORY_NAMES, SETTINGS_PAGE_NAMES } from "../constants";
import { getChannelDisplayString, getTwitchUserDisplayNameString } from "./displayNames";
import { getChannelInfo } from "./ircConfigs";
import { getUserInfo } from "./users";
import { getRouteData } from "./routeHelpers";
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

function handleLocationChange(location) {
	const { pathname } = location;
	currentPathname = pathname;

	let routeData = getRouteData(pathname);

	if (routeData) {
		let { query, logDate, type } = routeData;

		switch (type) {
			case "channel": {
				let channelInfo = getChannelInfo(query);
				if (channelInfo) {
					if (logDate) {
						setTitle(channelPageLogTitle(channelInfo, logDate));
					}
					else {
						setTitle(channelPageTitle(channelInfo));
					}
					return;
				}
				break;
			}

			case "user": {
				let userInfo = getUserInfo(query);
				if (userInfo) {
					if (logDate) {
						setTitle(userPageLogTitle(userInfo, logDate));
					}
					else {
						setTitle(userPageTitle(userInfo));
					}
					return;
				}
				break;
			}

			case "settings":
				setTitle(settingsPageTitle(query));
				return;

			case "category":
				setTitle(categoryPageTitle(query));
				return;
		}
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
