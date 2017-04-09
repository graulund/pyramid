import * as actionTypes from "../actionTypes";

const viewStateInitialState = {
	sidebarVisible: true
};

export default function (state = viewStateInitialState, action) {

	switch (action.type) {
		case actionTypes.viewState.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
