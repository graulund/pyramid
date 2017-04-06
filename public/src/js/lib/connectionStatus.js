import actions from "../actions";
import store from "../store";

export const GLOBAL_CONNECTION = "_global";

export const STATUS = {
	CONNECTED: "connected",
	DISCONNECTED: "disconnected",
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
