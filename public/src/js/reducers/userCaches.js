import clone from "lodash/clone";
import omit from "lodash/omit";

import * as actionTypes from "../actionTypes";
import { startExpiringUserCache } from "../lib/dataExpiration";
import { cacheMessageItem } from "../lib/messageCaches";

const userCachesInitialState = {};

export default function (state = userCachesInitialState, action) {

	switch (action.type) {
		case actionTypes.userCaches.UPDATE: {
			let { username, cache } = action;
			let item = state[username] || {};
			return {
				...state,
				[username]: {
					...item,
					cache,
					lastReload: new Date()
				}
			};
		}

		case actionTypes.userCaches.APPEND: {
			let s = clone(state), d = action.data;

			if (!s[d.username]) {
				s[d.username] = { cache: [] };
			}

			// Simpler append logic than channelCaches,
			// due to this stream only including message events

			s[d.username].cache = cacheMessageItem(s[d.username].cache, d);
			return s;
		}

		case actionTypes.userCaches.REMOVE: {
			let { username } = action;
			return omit(state, username);
		}

		case actionTypes.userCaches.STARTEXPIRATION: {
			let { username } = action;
			let item = state[username];
			if (item) {
				if (item.expirationTimer) {
					clearTimeout(item.expirationTimer);
				}

				return {
					...state,
					[username]: {
						...item,
						expirationTimer: startExpiringUserCache(username)
					}
				};
			}
			break;
		}

		case actionTypes.userCaches.STOPEXPIRATION: {
			let { username } = action;
			let item = state[username];
			if (item) {
				if (item.expirationTimer) {
					clearTimeout(item.expirationTimer);
				}

				return {
					...state,
					[username]: {
						...item,
						expirationTimer: null
					}
				};
			}
		}
	}

	return state;
}
