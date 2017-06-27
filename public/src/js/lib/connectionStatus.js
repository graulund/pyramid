import actions from "../actions";
import store from "../store";
import { serverNameFromChannelUri } from "./channelNames";

export const GLOBAL_CONNECTION = "_global";

export const STATUS = {
	ABORTED: "aborted",
	CONNECTED: "connected",
	DISCONNECTED: "disconnected",
	FAILED: "failed",
	REJECTED: "rejected"
};

function setConnectionStatus(key, status) {
	const info = { status, time: new Date() };
	store.dispatch(actions.connectionStatus.update({ [key]: info }));
}

export function setGlobalConnectionStatus(status) {
	setConnectionStatus(GLOBAL_CONNECTION, status);
}

export function setIrcConnectionStatus(serverName, status) {
	setConnectionStatus(serverName, status);
}

export function getMyIrcNick(serverName) {
	let state = store.getState();

	if (serverName && state.connectionStatus[serverName]) {
		return state.connectionStatus[serverName].nick;
	}

	return "";
}

export function getMyIrcNickFromChannel(channel) {
	let serverName = serverNameFromChannelUri(channel);

	if (serverName) {
		return getMyIrcNick(serverName);
	}

	return "";
}
