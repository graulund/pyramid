import store from "../store";
import { getChannelUri } from "./channelNames";
import { reportConversationAsSeen } from "./io";
import { parseConversationUrl } from "./routeHelpers";

export function reportConversationAsSeenIfNeeded(serverName, username) {
	let state = store.getState();
	let convo = state.unseenConversations[getChannelUri(serverName, username)];

	if (convo) {
		reportConversationAsSeen(serverName, username);
	}
}

export function handleNewUnseenConversationsList(list, del = true, onlyIfInFocus = true) {

	let inFocus = true;

	if (onlyIfInFocus) {
		let state = store.getState();
		inFocus = state.deviceState.inFocus;
	}

	// Ignore, and set as seen immediately, if we're currently on the page

	if (inFocus) {
		let { pathname } = location;
		let m = parseConversationUrl(pathname);

		if (m) {
			let serverName = m[1];
			let username = m[2];

			let userUri = getChannelUri(serverName, username);
			let convo = list[userUri];

			if (convo) {
				// Prevent flashes of badges
				if (del) {
					delete list[userUri];
				}

				reportConversationAsSeen(serverName, username);
			}
		}
	}

	return list;
}

export function reportConversationAsSeenIfOnPage(onlyIfInFocus = false) {
	let state = store.getState();
	handleNewUnseenConversationsList(state.unseenConversations, false, onlyIfInFocus);
}
