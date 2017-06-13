import { take } from "redux-saga/effects";

import * as actionTypes from "../actionTypes";
import actions from "../actions";
import store from "../store";

export default function* () {
	while (true) {
		let action = yield take([
			actionTypes.channelCaches.APPEND,
			actionTypes.channelCaches.UPDATE
		]);

		let channel = action.channel || action.data && action.data.channel;

		// Handle clears
		if (channel) {
			let items = action.cache || [action.data];

			if (items && items.length) {
				items.forEach((item) => {
					if (
						item &&
						item.type === "clearchat" &&
						item.time &&
						item.username
					) {
						let { time, username } = item;
						store.dispatch(actions.channelCaches.clearUser(
							channel, username, time
						));
					}
				});
			}
		}
	}
}
