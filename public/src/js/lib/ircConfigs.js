import store from "../store";
import actions from "../actions";
import { parseChannelUri, serverNameFromChannelUri } from "./channelNames";

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

export function getChannelInfo(channel) {
	var channelConfig = {};
	let state = store.getState();
	let uriData = parseChannelUri(channel);

	if (uriData) {
		let { channel: channelName, server } = uriData;

		let config = state.ircConfigs[server];
		let setting = state.appConfig.enableTwitchChannelDisplayNames;

		if (setting && config) {
			channelConfig = config.channels[channelName];
		}
	}

	return { channel, ...channelConfig };
}

export function getMyNickname(channel) {
	let state = store.getState();
	let serverName = serverNameFromChannelUri(channel);

	if (serverName && state.ircConfigs[serverName]) {
		return state.ircConfigs[serverName].nickname;
	}

	return "";
}
