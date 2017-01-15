import * as actionTypes from "../actionTypes";

const logDetailsInitialState = {};

export default function (state = logDetailsInitialState, action) {

	switch (action.type) {
		case actionTypes.logDetails.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
