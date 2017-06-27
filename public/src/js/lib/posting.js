import { sendMessage } from "./io";
import { getMyIrcNickFromChannel } from "../lib/connectionStatus";

import actions from "../actions";
import store from "../store";

function generateToken(length = 60) {
	const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var output = "";
	for (var i = 0; i < length; i++) {
		output += alpha[Math.round((alpha.length-1)*Math.random())];
	}
	return output;
}

function prepareOfflineMessage(messageData) {
	let { message } = messageData;
	let meRegex = /^\/me\s+/;

	if (meRegex.test(message)) {
		return {
			...messageData,
			message: message.replace(meRegex, ""),
			type: "action"
		};
	}

	return messageData;
}

export function postMessage(channel, message) {
	let messageToken = generateToken();
	let username = getMyIrcNickFromChannel(channel);
	let messageData = prepareOfflineMessage({
		channel,
		offline: true,
		origMessage: message,
		message,
		messageToken,
		time: new Date().toISOString(),
		type: "msg",
		username
	});

	store.dispatch(actions.offlineMessages.add(channel, messageToken, messageData));
	sendMessage(channel, message, messageToken);
}

export function resendOfflineMessage(channel, messageToken) {
	let state = store.getState();
	let messageData = state.offlineMessages[channel] &&
		state.offlineMessages[channel][messageToken];

	if (messageData) {
		store.dispatch(actions.offlineMessages.remove(channel, messageToken));
		postMessage(channel, messageData.origMessage);
	}
	else {
		console.warn("Tried to resend offline message that did not exist");
	}
}
