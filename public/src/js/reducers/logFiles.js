import * as actionTypes from "../actionTypes";
import merge from "lodash/merge";
import omit from "lodash/omit";

const logFilesInitialState = {};

export default function (state = logFilesInitialState, action) {

	switch (action.type) {
		case actionTypes.logFiles.UPDATE:
			return merge(state, action.data);
		case actionTypes.logFiles.CLEAR:
			if (action.channel && action.date) {
				// Clear specific file: Channel and date
				if (state[action.channel]) {
					return {
						...state,
						[action.channel]: omit(state[action.channel], action.date)
					};
				}
			}
			else if (action.channel) {
				// Clear all channel logs
				return {
					...state,
					[action.channel]: {}
				};
			}
			else {
				// Clear everything
				return {};
			}
			return state;
	}

	return state;
}
