import * as actionTypes from "../actionTypes";

const lastSeenInitialState = {};

export default function (state = lastSeenInitialState, action) {

	switch (action.type) {
		case actionTypes.lastSeenUsers.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
