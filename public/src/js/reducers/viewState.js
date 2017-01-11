import * as actionTypes from "../actionTypes";

const viewStateInitial = {
	sidebarVisible: true
};

export default function (state = viewStateInitial, action) {

	switch (action.type) {
		case actionTypes.viewState.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
