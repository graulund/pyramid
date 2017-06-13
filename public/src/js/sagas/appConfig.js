import { take } from "redux-saga/effects";

import * as actionTypes from "../actionTypes";
import { setDarkModeStatus } from "../lib/visualBehavior";

export default function* () {
	while (true) {
		var action = yield take(actionTypes.appConfig.UPDATE);

		// Handle new settings

		// Add/remove dark mode
		if (action.data && "enableDarkMode" in action.data) {
			const { enableDarkMode } = action.data;
			setDarkModeStatus(enableDarkMode);
		}
	}
}
