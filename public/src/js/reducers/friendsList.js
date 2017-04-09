import * as actionTypes from "../actionTypes";

const friendsLevelInitialState = {};

export default function (state = friendsLevelInitialState, action) {

	switch (action.type) {
		case actionTypes.friendsList.UPDATE:
			if (action.level) {
				const existingLevelData = state[action.level] || [];

				return {
					...state,
					[action.level]: [
						...existingLevelData,
						...action.data
					]
				};
			}
			return state;

		case actionTypes.friendsList.SET:
			return action.data;
	}

	return state;
}
