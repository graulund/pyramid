import clone from "lodash/clone";

import * as actionTypes from "../actionTypes";
import { cacheItem } from "../lib/io";

const categoryCachesInitialState = {};

export default function (state = categoryCachesInitialState, action) {

	switch (action.type) {
		case actionTypes.categoryCaches.UPDATE:
			return {
				...state,
				...action.data
			};
		case actionTypes.categoryCaches.APPEND:
			var s = clone(state), d = action.data;

			if (!s[d.categoryName]) {
				s[d.categoryName] = [];
			}

			// Simpler append logic than channelCaches,
			// due to this stream only including message events

			s[d.categoryName] = cacheItem(s[d.categoryName], d.item);
			return s;
	}

	return state;
}
