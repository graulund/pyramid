import actions from "../actions";
import store from "../store";

import { RELATIONSHIP_NONE } from "../constants";

export function initializeIo() {
	if (window.io) {
		var io = window.io;

		var socket = io();

		socket.on("msg", (details) => {
			const { channel, channelName, time, relationship, username } = details;

			// DEBOUNCE THIS
			store.dispatch(actions.lastSeenChannels.update({
				[channel]: { username, time }
			}));

			if (relationship === RELATIONSHIP_NONE) {
				return;
			}

			// DEBUG
			console.log("msg", details);
			console.log(
				"%c" + details.username + " in " + details.channel + ": %c" +
				details.message, "font-size: 24px; font-weight: bold", "font-size: 24px"
			);

			store.dispatch(actions.lastSeenUsers.update({
				[username]: { channel, channelName, time }
			}));
		});
	}
};
