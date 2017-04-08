import * as actionTypes from "../actionTypes";

const onlineFriendsInitialState = {};

export default function (state = onlineFriendsInitialState, action) {

	switch (action.type) {
		case actionTypes.onlineFriends.SET:
			return action.data;
	}

	return state;
}
