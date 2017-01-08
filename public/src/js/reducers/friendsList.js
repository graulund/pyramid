import * as actionTypes from "../actionTypes";

const friendsLevelInitialState = {};

export default function (state = friendsLevelInitialState, action) {

	switch (action.type) {
		case actionTypes.friendsList.UPDATE:
			if (action.level) {
				if (!state[action.level]) {
					state[action.level] = [];
				}

				return {
					...state,
					[action.level]: [
						...state[action.level],
						...action.data
					]
				};
			}
	}

	return state;
}
