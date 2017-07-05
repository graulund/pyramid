import clone from "lodash/clone";
import omit from "lodash/omit";

import * as actionTypes from "../actionTypes";
import { startExpiringChannelCache } from "../lib/dataExpiration";
import { cacheMessageItem, clearReplacedIdsFromCache } from "../lib/messageCaches";

const channelCachesInitialState = {};

function clearUserHandler(username, time) {
	let d = new Date(time);
	return function(item) {
		if (
			// By this user...
			item.username === username &&
			// Not already cleared...
			!item.cleared &&
			// Messages only...
			(
				item.type === "msg" ||
				item.type === "action" ||
				item.type === "notice"
			) &&
			// With timestamps...
			item.time &&
			// ...that are before the ban time.
			new Date(item.time) <= d
		) {
			// The message is cleared!
			return { ...item, cleared: true };
		}

		return item;
	};
}

export default function (state = channelCachesInitialState, action) {

	switch (action.type) {
		case actionTypes.channelCaches.UPDATE: {
			let { channel, cache } = action;
			let item = state[channel] || {};
			return {
				...state,
				[channel]: {
					...item,
					cache,
					lastReload: new Date()
				}
			};
		}

		case actionTypes.channelCaches.APPEND: {
			let s = clone(state), d = action.data;

			if (!s[d.channel]) {
				s[d.channel] = { cache: [] };
			}

			// Clear any replaced ids, and then append to cache

			s[d.channel].cache = cacheMessageItem(
				clearReplacedIdsFromCache(s[d.channel].cache, d.prevIds),
				d
			);

			return s;
		}

		case actionTypes.channelCaches.REMOVE: {
			let { channel } = action;
			return omit(state, channel);
		}

		case actionTypes.channelCaches.CLEARUSER: {
			let { channel, time, username } = action;
			let channelItem = state[channel] || {};
			let cacheList = channelItem.cache || [];
			return {
				...state,
				[channel]: {
					cache: cacheList.map(clearUserHandler(username, time)),
					lastReload: channelItem.lastReload
				}
			};
		}

		case actionTypes.channelCaches.STARTEXPIRATION: {
			let { channel } = action;
			let item = state[channel];
			if (item) {
				return {
					...state,
					[channel]: {
						...item,
						expirationTimer: startExpiringChannelCache(channel)
					}
				};
			}
			break;
		}

		case actionTypes.channelCaches.STOPEXPIRATION: {
			let { channel } = action;
			let item = state[channel];
			if (item) {
				clearTimeout(item.expirationTimer);

				return {
					...state,
					[channel]: {
						...item,
						expirationTimer: null
					}
				};
			}
		}
	}

	return state;
}
