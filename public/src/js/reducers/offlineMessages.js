import omit from "lodash/omit";

import * as actionTypes from "../actionTypes";

const offlineMessagesInitialState = {};

export default function (state = offlineMessagesInitialState, action) {

	switch (action.type) {
		case actionTypes.offlineMessages.ADD: {
			let { channel, message, messageToken } = action;
			let current = state[channel] || {};
			return {
				...state,
				[channel]: {
					...current,
					[messageToken]: message
				}
			};
		}

		case actionTypes.offlineMessages.REMOVE: {
			let { channel, messageToken } = action;
			if (state[channel] && state[channel][messageToken]) {
				return {
					...state,
					[channel]: omit(state[channel], messageToken)
				};
			}

			return state;
		}
	}

	return state;
}
