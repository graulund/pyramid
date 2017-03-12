import store from "../store";
import actions from "../actions";

export function calibrateMultiServerChannels(ircConfigs) {
	var multiServerChannels = [];
	var namesSeen = [];
	for (var i = 0; i < ircConfigs.length; i++) {
		var c = ircConfigs[i];
		if (c && c.channels) {
			for (var j = 0; j < c.channels.length; j++) {
				var ch = c.channels[j];
				if (namesSeen.indexOf(ch) >= 0) {
					multiServerChannels.push(ch);
				}
				namesSeen.push(ch);
			}
		}
	}

	return multiServerChannels;
}

export function resetMultiServerChannels() {
	const state = store.getState();
	store.dispatch(actions.multiServerChannels.set(
		calibrateMultiServerChannels(state.ircConfigs)
	));
}

export function updateIrcConfigs(ircConfigs) {
	// Add the new ones
	store.dispatch(actions.ircConfigs.update(ircConfigs));

	// Check multi server channels now
	resetMultiServerChannels();
}

export function setIrcConfigs(ircConfigs) {
	// Add the new ones
	store.dispatch(actions.ircConfigs.set(ircConfigs));

	// Check multi server channels now
	resetMultiServerChannels();
}

// TODO: Turn these into sagas?
