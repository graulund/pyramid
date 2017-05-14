import * as actionTypes from "../actionTypes";

const deviceStateInitialState = {
	inFocus: true,
	isTouchDevice: false,
	visible: true
};

export default function (state = deviceStateInitialState, action) {

	switch (action.type) {
		case actionTypes.deviceState.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
