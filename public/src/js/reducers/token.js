import * as actionTypes from "../actionTypes";

const tokenInitialState = null;

export default function (state = tokenInitialState, action) {

	// This always replaces
	switch (action.type) {
		case actionTypes.token.SET:
			return action.data;
	}

	return state;
}
