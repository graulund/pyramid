import * as actionTypes from "../actionTypes";

const channelDataInitialState = {};

export default function (state = channelDataInitialState, action) {

	switch (action.type) {
		case actionTypes.channelData.UPDATE: {
			let { channel, data } = action;
			if (data) {
				let current = state[channel] || {};
				return {
					...state,
					[channel]: {
						...current,
						...data
					}
				};
			}
		}
	}

	return state;
}
