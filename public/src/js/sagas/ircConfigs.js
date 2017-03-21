import { put, take } from "redux-saga/effects";

import * as actionTypes from "../actionTypes";
import actions from "../actions";
import { calibrateMultiServerChannels } from "../lib/ircConfigs";

export default function* () {
	while (true) {
		var action = yield take([
			actionTypes.ircConfigs.SET, actionTypes.ircConfigs.UPDATE
		]);

		// Handle changes in IRC config: Update multiserver channels
		// TODO: Does this work properly with update? Do we have all the data?
		yield put(actions.multiServerChannels.set(
			calibrateMultiServerChannels(action.data)
		));
	}
}
