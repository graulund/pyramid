function closeNotificationAfterTimeout(n) {
	setTimeout(n.close.bind(n), 5000);
}

function sendNotification(title, body) {
	if (!window.Notification) {
		return;
	}

	else if (Notification.permission === "granted") {
		var n = new Notification(title, { body });
		closeNotificationAfterTimeout(n);
	}

	else if (Notification.permission !== "denied") {
		Notification.requestPermission((permission) => {
			if (permission === "granted") {
				var n = new Notification(title, { body });
				closeNotificationAfterTimeout(n);
			}
		});
	}
}

export function sendMessageNotification(msg) {
	if (msg) {
		sendNotification(`${msg.username} in ${msg.channelName}`, msg.message);
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
