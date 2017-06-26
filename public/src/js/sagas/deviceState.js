import { take } from "redux-saga/effects";

import * as actionTypes from "../actionTypes";
import { reportConversationAsSeenIfOnPage } from "../lib/conversations";

export default function* () {
	while (true) {
		var action = yield take(actionTypes.deviceState.UPDATE);

		// Handle new settings

		// If we go into focus
		if (action.data && action.data.inFocus) {
			reportConversationAsSeenIfOnPage();
		}
	}
}
