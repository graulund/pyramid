import store from "../store";
import actions from "../actions";

export function calibrateMultiServerChannels(ircConfigs) {
	let multiServerChannels = [];
	let namesSeen = [];

	Object.keys(ircConfigs).forEach((name) => {
		let c = ircConfigs[name];
		if (c && c.channels) {
			Object.keys(c.channels).forEach((ch) => {
				if (namesSeen.indexOf(ch) >= 0) {
					multiServerChannels.push(ch);
				}
				namesSeen.push(ch);
			});
		}
	});

	return multiServerChannels;
}

export function resetMultiServerChannels() {
	const state = store.getState();
	store.dispatch(actions.multiServerChannels.set(
		calibrateMultiServerChannels(state.ircConfigs)
	));
}

export function isTwitch(ircConfig) {
	if (ircConfig) {
		return /irc\.(chat\.)?twitch\.tv/.test(ircConfig.hostname);
	}

	return false;
}
