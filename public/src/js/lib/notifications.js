import {
	getChannelDisplayString,
	getTwitchUserDisplayNameString,
	DISPLAY_NAME_PREFIX_TYPES
} from "./displayNames";
import { getChannelInfo } from "./ircConfigs";
import store from "../store";

const icon = "/img/touchicon.png";

var notificationsActive = true;
var userDisplayNameSetting = 0;
var channelDisplayNameSetting = false;

function closeNotificationAfterTimeout(n) {
	setTimeout(n.close.bind(n), 5000);
}

function sendNotification(title, body) {
	if (!window.Notification || !notificationsActive) {
		console.log("Skipped notification due to not being active");
		return;
	}

	else if (Notification.permission === "granted") {
		var n = new Notification(title, { body, icon });
		closeNotificationAfterTimeout(n);
	}

	else if (Notification.permission !== "denied") {
		Notification.requestPermission((permission) => {
			if (permission === "granted") {
				var n = new Notification(title, { body, icon });
				closeNotificationAfterTimeout(n);
			}
		});
	}
}

export function sendMessageNotification(msg) {
	if (msg) {
		let { channel, message, tags, username } = msg;

		let channelInfo = getChannelInfo(channel);
		let channelDisplayName = channelInfo && channelInfo.displayName;
		let userDisplayName = tags && tags["display-name"];

		let channelString = getChannelDisplayString(
			channel,
			{
				displayName: channelDisplayName,
				enableTwitchChannelDisplayNames: channelDisplayNameSetting,
				enableTwitchUserDisplayNames: userDisplayNameSetting,
				prefixType: DISPLAY_NAME_PREFIX_TYPES.LOWERCASE,
				userDisplayNames: { [username]: userDisplayName }
			}
		);

		let name = getTwitchUserDisplayNameString(
			username,
			userDisplayName,
			userDisplayNameSetting
		);

		sendNotification(`${name} in ${channelString}`, message);
	}
}

export function askForNotificationsPermission() {
	// TODO: Use this somewhere...
	if (
		window.Notification &&
		Notification.permission !== "granted" &&
		Notification.permission !== "denied"
	) {
		Notification.requestPermission((status) => {
			if (Notification.permission !== status) {
				Notification.permission = status;
			}
		});
	}
}

export function startUpdatingNotificationsActiveState() {
	store.subscribe(function() {
		let state = store.getState();
		let { appConfig, deviceState } = state;
		let { enableDesktopNotifications } = appConfig;
		let { inFocus, visible } = deviceState;

		let active = enableDesktopNotifications && (!visible || !inFocus);

		if (active !== notificationsActive) {
			notificationsActive = active;
		}

		let {
			enableTwitchChannelDisplayNames,
			enableTwitchUserDisplayNames
		} = appConfig;

		if (channelDisplayNameSetting !== enableTwitchChannelDisplayNames) {
			channelDisplayNameSetting = enableTwitchChannelDisplayNames;
		}

		if (userDisplayNameSetting !== enableTwitchUserDisplayNames) {
			userDisplayNameSetting = enableTwitchUserDisplayNames;
		}
	});
}
