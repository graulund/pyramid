import * as actionTypes from "../actionTypes";

const appConfigInitialState = {};

export default function (state = appConfigInitialState, action) {

	switch (action.type) {
		case actionTypes.appConfig.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
