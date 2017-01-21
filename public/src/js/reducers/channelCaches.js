import clone from "lodash/clone";

import * as actionTypes from "../actionTypes";
import { cacheItem, clearReplacedIdsFromCache } from "../lib/io";

const channelCaches = {};

export default function (state = channelCaches, action) {

	switch (action.type) {
		case actionTypes.channelCaches.UPDATE:
			return {
				...state,
				...action.data
			};
		case actionTypes.channelCaches.APPEND:
			var s = clone(state), d = action.data;
			if (!s[d.channel]) {
				s[d.channel] = [];
			}
			s[d.channel] = cacheItem(
				clearReplacedIdsFromCache(s[d.channel], d.prevIds),
				d
			);
			return s;
	}

	return state;
}
