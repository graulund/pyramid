import store from "../store";

export function getUserInfo(username) {
	let state = store.getState();
	let user = state.lastSeenUsers[username];

	if (user) {
		return { username, ...user };
	}

	return null;
}
