import { take } from "redux-saga/effects";

import * as actionTypes from "../actionTypes";

export default function* () {
	while (true) {
		var action = yield take(actionTypes.appConfig.UPDATE);

		// Handle new settings

		// Add/remove dark mode
		if (action.data && "enableDarkMode" in action.data) {
			const classList = document.body.classList;
			const { enableDarkMode } = action.data;
			const className = "darkmode";
			if (enableDarkMode && !classList.contains(className)) {
				classList.add(className);
			}
			else if (!enableDarkMode && classList.contains(className)) {
				classList.remove(className);
			}
		}
	}
}
