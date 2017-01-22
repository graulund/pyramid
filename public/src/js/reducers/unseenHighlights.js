import * as actionTypes from "../actionTypes";

const unseenHighlightsInitialState = null;

export default function (state = unseenHighlightsInitialState, action) {

	// This always replaces
	switch (action.type) {
		case actionTypes.unseenHighlights.SET:
			return action.data;
	}

	return state;
}
