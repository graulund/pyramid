import * as actionTypes from "../actionTypes";

const channelUserListsInitialState = {};

export default function (state = channelUserListsInitialState, action) {

	switch (action.type) {
		case actionTypes.channelUserLists.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
