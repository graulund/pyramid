import clone from "lodash/clone";

import * as actionTypes from "../actionTypes";
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
	}

	return state;
}
