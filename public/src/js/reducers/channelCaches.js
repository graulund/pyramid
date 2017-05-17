import clone from "lodash/clone";

import * as actionTypes from "../actionTypes";
import { cacheItem, clearReplacedIdsFromCache } from "../lib/io";

const channelCachesInitialState = {};

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

			s[d.channel].cache = cacheItem(
				clearReplacedIdsFromCache(s[d.channel].cache, d.prevIds),
				d
			);

			return s;
		}
	}

	return state;
}
