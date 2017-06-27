import store from "../store";
import actions from "../actions";
import { getChannelUri, parseChannelUri } from "./channelNames";

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
	let uriData = parseChannelUri(channel);

	if (uriData) {
		let { channel: channelName, server } = uriData;
		return getChannelInfoByNames(server, channelName);
	}

	return null;
}

export function getChannelInfoByNames(serverName, channelName) {
	let state = store.getState();
	let config = state.ircConfigs[serverName];
	let channelConfig = config && config.channels[channelName];

	if (channelConfig) {
		let channel = getChannelUri(serverName, channelName);
		return { channel, ...channelConfig };
	}

	return null;
}
