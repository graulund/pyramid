import { channelNameFromUri } from "./channelNames";
import { getTwitchChannelDisplayNameString, getTwitchUserDisplayNameString } from "./displayNames";
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
		let channelInfo = getChannelInfo(msg.channel);
		let channelString = getTwitchChannelDisplayNameString(
			channelNameFromUri(msg.channel),
			channelInfo && channelInfo.displayName,
			channelDisplayNameSetting,
			userDisplayNameSetting
		);
		let name = getTwitchUserDisplayNameString(
			msg.username,
			msg.tags && msg.tags["display-name"],
			userDisplayNameSetting
		);
		sendNotification(`${name} in ${channelString}`, msg.message);
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

		let active = appConfig.enableDesktopNotifications &&
			(!deviceState.visible || !deviceState.inFocus);

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
