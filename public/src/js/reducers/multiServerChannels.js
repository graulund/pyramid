import * as actionTypes from "../actionTypes";

const multiServerChannelsInitialState = [];

export default function (state = multiServerChannelsInitialState, action) {

	// This always replaces
	switch (action.type) {
		case actionTypes.multiServerChannels.SET:
			return action.data;
	}

	return state;
}
