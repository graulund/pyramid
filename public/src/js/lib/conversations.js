import actions from "../actions";
import store from "../store";
import { getChannelUri } from "./channelNames";
import { reportConversationAsSeen } from "./io";

function conversationKey(serverName, username) {
	return getChannelUri(serverName, username);
}

function setOpenConversationValue(key, diff) {
	let state = store.getState();
	let { openConversations = {} } = state.viewState;
	let conversationValue = openConversations[key] || 0;
	store.dispatch(actions.viewState.update({
		openConversations: {
			...openConversations,
			[key]: conversationValue + diff
		}
	}));
}

export function setConversationAsOpen(serverName, username) {
	let key = conversationKey(serverName, username);
	setOpenConversationValue(key, 1);
}

export function setConversationAsClosed(serverName, username) {
	let key = conversationKey(serverName, username);
	setOpenConversationValue(key, -1);
}

export function reportConversationAsSeenIfNeeded(serverName, username) {
	let key = conversationKey(serverName, username);
	let state = store.getState();
	let convo = state.unseenConversations[key];

	if (convo) {
		reportConversationAsSeen(serverName, username);
	}
}

export function handleNewUnseenConversationsList(list) {
	// Do not include the ones open, if in focus, to prevent flashes

	if (list && Object.keys(list).length) {
		let state = store.getState();
		let { inFocus } = state.deviceState;
		let { openConversations } = state.viewState;

		if (inFocus && openConversations) {
			list = { ...list };
			Object.keys(list).forEach((key) => {
				if (openConversations[key] > 0) {
					let item = list[key];

					// Report them as seen if they're open and we're in focus
					if (item) {
						let { serverName, username } = item;
						reportConversationAsSeen(serverName, username);
					}

					delete list[key];
				}
			});
		}
	}

	return list;
}
