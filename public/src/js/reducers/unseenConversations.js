import * as actionTypes from "../actionTypes";

const unseenConversationsInitialState = null;

export default function (state = unseenConversationsInitialState, action) {

	// This always replaces
	switch (action.type) {
		case actionTypes.unseenConversations.SET:
			return action.data;
	}

	return state;
}
