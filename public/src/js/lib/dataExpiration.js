// Data expiration: Slowly killing and freeing up resources in the frontend
// that we no longer need

import actions from "../actions";
import store from "../store";
import { getCurrentData } from "./multiChat";
import { getRouteData } from "./routeHelpers";

const CACHE_EXPIRATION_TIME = 300000; // 5 minutes

var prevPathname = "";

export function startExpiringChannelCache(channel) {
	return setTimeout(function() {
		console.log(`Expiring cache for channel ${channel}`);
		store.dispatch(actions.channelCaches.remove(channel));
	}, CACHE_EXPIRATION_TIME);
}

export function startExpiringUserCache(username) {
	return setTimeout(function() {
		console.log(`Expiring cache for user ${username}`);
		store.dispatch(actions.userCaches.remove(username));
	}, CACHE_EXPIRATION_TIME);
}

export function handleItemVisible(item) {
	let { type, query } = item;

	if (type === "channel") {
		store.dispatch(actions.channelCaches.stopExpiration(query));
	}

	else if (type === "user") {
		store.dispatch(actions.userCaches.stopExpiration(query));
	}
}

export function handleItemNoLongerVisible(item) {
	let { type, query } = item;

	if (type === "channel") {
		store.dispatch(actions.channelCaches.startExpiration(query));
	}

	else if (type === "user") {
		store.dispatch(actions.userCaches.startExpiration(query));
	}
}

export function updateMultiChatVisibility(visible, layout) {
	let { currentLayout } = getCurrentData();

	if (!layout) {
		layout = currentLayout;
	}

	if (layout) {
		layout.forEach((item) => {
			if (item) {
				if (visible) {
					handleItemVisible(item);
				}

				else {
					handleItemNoLongerVisible(item);
				}
			}
		});
	}
}

function handleLocationChange(location) {
	let { pathname } = location;

	// Clear all line infos on location change
	store.dispatch(actions.lineInfo.clear());

	// If user or channel cache:
	// Start expiration timer on cache you just went away from

	let prevRouteData = getRouteData(prevPathname);

	if (prevRouteData) {
		if (prevRouteData.type === "home") {
			// Leaving multichat
			updateMultiChatVisibility(false);
		}

		else {
			handleItemNoLongerVisible(prevRouteData);
		}
	}

	// Stop expiration timer on cache you just went into

	let currentRouteData = getRouteData(pathname);

	if (currentRouteData) {
		if (currentRouteData.type === "home") {
			// Entering multichat
			updateMultiChatVisibility(true);
		}

		else {
			handleItemVisible(currentRouteData);
		}
	}

	// Set prev pathname

	prevPathname = pathname;
}

export default function setUpDataExpiration(history) {
	history.listen(handleLocationChange);
	handleLocationChange(location);
}
