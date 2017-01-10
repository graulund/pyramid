import clone from "lodash/clone";

import * as actionTypes from "../actionTypes";
import { cacheMessage } from "../lib/io";

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
			s[d.channel] = cacheMessage(s[d.channel], d.message);
			return s;
	}

	return state;
}
