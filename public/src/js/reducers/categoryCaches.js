import clone from "lodash/clone";

import * as actionTypes from "../actionTypes";
import { cacheMessageItem } from "../lib/messageCaches";

const categoryCachesInitialState = {};

export default function (state = categoryCachesInitialState, action) {

	switch (action.type) {
		case actionTypes.categoryCaches.UPDATE: {
			let { categoryName, cache } = action;
			let item = state[categoryName] || {};
			return {
				...state,
				[categoryName]: {
					...item,
					cache,
					lastReload: new Date()
				}
			};
		}

		case actionTypes.categoryCaches.APPEND: {
			let s = clone(state), d = action.data;

			if (!s[d.categoryName]) {
				s[d.categoryName] = { cache: [] };
			}

			// Simpler append logic than channelCaches,
			// due to this stream only including message events

			s[d.categoryName].cache = cacheMessageItem(
				s[d.categoryName].cache, d.item
			);

			return s;
		}
	}

	return state;
}
