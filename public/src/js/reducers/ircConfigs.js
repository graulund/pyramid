import * as actionTypes from "../actionTypes";

const ircConfigsInitial = {};

export default function (state = ircConfigsInitial, action) {

	switch (action.type) {
		case actionTypes.ircConfigs.UPDATE:
			return {
				...state,
				...action.data
			};
	}

	return state;
}
