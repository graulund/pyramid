import * as actionTypes from "../actionTypes";

const systemInfoInitialState = {};

export default function (state = systemInfoInitialState, action) {

	switch (action.type) {
		case actionTypes.systemInfo.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
