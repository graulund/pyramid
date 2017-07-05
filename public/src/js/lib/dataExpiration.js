// Data expiration: Slowly killing and freeing up resources in the frontend
// that we no longer need

import actions from "../actions";
import store from "../store";
import { getRouteData } from "./routeHelpers";

const CACHE_EXPIRATION_TIME = 300000; // 5 minutes

var prevPathname = "";

export function startExpiringChannelCache(channel) {
	return setTimeout(function() {
		store.dispatch(actions.channelCaches.remove(channel));
	}, CACHE_EXPIRATION_TIME);
}

export function startExpiringUserCache(username) {
	return setTimeout(function() {
		store.dispatch(actions.userCaches.remove(username));
	}, CACHE_EXPIRATION_TIME);
}

function handleLocationChange(location) {
	let { pathname } = location;

	// Clear all line infos on location change
	store.dispatch(actions.lineInfo.clear());

	// If user or channel cache:
	// Start expiration timer on cache you just went away from

	let prevRouteData = getRouteData(prevPathname);

	if (prevRouteData) {
		let { type, query } = prevRouteData;

		if (type === "channel") {
			store.dispatch(actions.channelCaches.startExpiration(query));
		}

		else if (type === "user") {
			store.dispatch(actions.userCaches.startExpiration(query));
		}
	}

	// Stop expiration timer on cache you just went into

	let currentRouteData = getRouteData(pathname);

	if (currentRouteData) {
		let { type, query } = currentRouteData;

		if (type === "channel") {
			store.dispatch(actions.channelCaches.stopExpiration(query));
		}

		else if (type === "user") {
			store.dispatch(actions.userCaches.stopExpiration(query));
		}
	}


	// Set prev pathname

	prevPathname = pathname;
}

export default function setUpDataExpiration(history) {
	history.listen(handleLocationChange);
	handleLocationChange(location);
}
