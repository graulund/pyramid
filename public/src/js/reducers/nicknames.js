import * as actionTypes from "../actionTypes";

const nicknamesInitialState = {};

export default function (state = nicknamesInitialState, action) {

	switch (action.type) {
		case actionTypes.nicknames.UPDATE:
			return {
				...state,
				...action.data
			};

		case actionTypes.nicknames.SET:
			return action.data;
	}

	return state;
}
