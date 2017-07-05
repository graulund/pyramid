import * as actionTypes from "../actionTypes";

const lineInfoInitialState = {};

export default function (state = lineInfoInitialState, action) {

	switch (action.type) {
		case actionTypes.lineInfo.CLEAR:
			return lineInfoInitialState;

		case actionTypes.lineInfo.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
