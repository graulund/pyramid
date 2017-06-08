import * as actionTypes from "../actionTypes";

const serverDataInitialState = {};

export default function (state = serverDataInitialState, action) {

	switch (action.type) {
		case actionTypes.serverData.SET:
			return action.data;

		case actionTypes.serverData.UPDATE: {
			let { server, data } = action;
			if (data) {
				let current = state[server] || {};
				return {
					...state,
					[server]: {
						...current,
						...data
					}
				};
			}
		}
	}

	return state;
}
