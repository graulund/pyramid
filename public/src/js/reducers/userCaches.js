import clone from "lodash/clone";

import * as actionTypes from "../actionTypes";
import { cacheItem } from "../lib/io";

const userCachesInitialState = {};

export default function (state = userCachesInitialState, action) {

	switch (action.type) {
		case actionTypes.userCaches.UPDATE:
			return {
				...state,
				...action.data
			};
		case actionTypes.userCaches.APPEND:
			var s = clone(state), d = action.data;
			if (!s[d.username]) {
				s[d.username] = [];
			}
			s[d.username] = cacheItem(s[d.username], d);
			return s;
	}

	return state;
}
