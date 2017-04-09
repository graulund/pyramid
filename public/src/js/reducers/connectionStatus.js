import * as actionTypes from "../actionTypes";

const connectionStatusInitialState = {};

export default function (state = connectionStatusInitialState, action) {

	switch (action.type) {
		case actionTypes.connectionStatus.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
