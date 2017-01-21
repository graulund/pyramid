import actions from "../actions";
import store from "../store";
import pull from "lodash/pull";

import { CACHE_LINES } from "../constants";

var io;
var socket;

export function subscribeToChannel(channelUrl) {
	if (socket) {
		socket.emit("subscribe", {
			channel: channelUrl
		});
	}
}

export function unsubscribeFromChannel(channelUrl) {
	if (socket) {
		socket.emit("unsubscribe", {
			channel: channelUrl
		});
	}
}

export function subscribeToUser(username) {
	if (socket) {
		socket.emit("subscribe", { username });
	}
}

export function unsubscribeFromUser(username) {
	if (socket) {
		socket.emit("unsubscribe", { username });
	}
}

export function sendMessage(channelUrl, message) {
	if (socket) {
		const state = store.getState();
		const data = {
			channel: channelUrl,
			message,
			token: state && state.token
		};

		socket.emit("sendMessage", data);
	}
}

export function cacheItem(cache, item) {
	// Add it, or them
	if (item) {
		if (item instanceof Array) {
			cache = cache.concat(item);
		} else {
			cache = [ ...cache, item ];
		}
	}

	// And make sure we only have the maximum amount
	if (cache.length > CACHE_LINES) {
		if (cache.length === CACHE_LINES + 1) {
			cache = cache.slice(1);
		} else {
			cache = cache.slice(cache.length - CACHE_LINES);
		}
	}

	return cache;
}

export function clearReplacedIdsFromCache(cache, prevIds) {
	if (cache && cache.length && prevIds && prevIds.length) {
		const itemsWithPrevIds = cache.filter((item) => prevIds.indexOf(item.id) >= 0);
		return pull(cache, ...itemsWithPrevIds);

		// NOTE: We are modifiying in place to prevent too many change handlers from
		// occuring. We are expecting the caller to create a new array with an added
		// item immediately after having called this method.
	}

	return cache;
}

export function requestLogDetailsForChannel(channelUri) {
	if (socket) {
		socket.emit("requestChannelLogDetails", { channelUri });
	}
}

export function requestLogDetailsForUsername(username) {
	if (socket) {
		socket.emit("requestUserLogDetails", { username });
	}
}

export function requestLogFileForChannel(channelUri, time) {
	if (socket) {
		console.log("Requesting channel log file:", { channelUri, time });
		socket.emit("requestChannelLogFile", { channelUri, time });
	}
}

export function requestLogFileForUsername(username, time) {
	if (socket) {
		console.log("Requesting user log file:", { time, username });
		socket.emit("requestUserLogFile", { time, username });
	}
}

var updateLastSeenChannel = (channel, username, time) => {
	store.dispatch(actions.lastSeenChannels.update({
		[channel]: { username, time }
	}));
};

var updateLastSeenUser = (username, channel, time) => {
	store.dispatch(actions.lastSeenUsers.update({
		[username]: { channel, time }
	}));
};

export function initializeIo() {
	if (window.io) {
		io = window.io;
		socket = io();

		socket.on("connect", () => {
			const state = store.getState();
			if (state && state.token) {
				socket.emit("token", { token: state.token });
			} else {
				console.warn("No token found to send on socket startup");
			}
		});

		const onChatEvent = (details) => {
			const { relationship, type, username } = details;

			store.dispatch(actions.channelCaches.append(details));

			if (!relationship || type !== "msg") {
				return;
			}

			// DEBUG
			console.log("msg", details);
			console.log(
				"%c" + details.username + " in " + details.channel + ": %c" +
				details.message, "font-size: 24px; font-weight: bold", "font-size: 24px"
			);

			store.dispatch(actions.userCaches.append({
				username,
				message: details
			}));
		};

		socket.on("msg", onChatEvent);
		socket.on("join", onChatEvent);
		socket.on("part", onChatEvent);
		socket.on("quit", onChatEvent);
		socket.on("kick", onChatEvent);
		socket.on("kill", onChatEvent);
		socket.on("events", onChatEvent);

		socket.on("names", (details) => {
			console.log("Received names event:", details);
		});

		socket.on("lastSeen", (instances) => {
			if (instances && instances.length) {
				instances.forEach((details) => {
					if (details.data) {
						if (details.channel) {
							const { username, time } = details.data;
							updateLastSeenChannel(details.channel, username, time);
						}
						else if (details.username) {
							const { channel, time } = details.data;
							updateLastSeenUser(details.username, channel, time);
						}
					}
				});
			}
		});

		socket.on("channelCache", (details) => {
			console.log("Received channel cache!", details);
			if (details && details.channelUri && details.cache) {
				store.dispatch(actions.channelCaches.update({
					[details.channelUri]: details.cache
				}));
			}
		});

		socket.on("userCache", (details) => {
			console.log("Received user cache!", details);
			if (details && details.username && details.cache) {
				store.dispatch(actions.userCaches.update({
					[details.username]: details.cache
				}));
			}
		});

		socket.on("channelLogDetails", (details) => {
			console.log("Received channel log details!", details);
			if (details && details.channelUri && details.details) {
				store.dispatch(actions.logDetails.update({
					["channel:" + details.channelUri]: details.details
				}));
			}
		});

		socket.on("userLogDetails", (details) => {
			console.log("Received user log details!", details);
			if (details && details.username && details.details) {
				store.dispatch(actions.logDetails.update({
					["user:" + details.username]: details.details
				}));
			}
		});

		socket.on("channelLogFile", (details) => {
			console.log("Received channel log file!", details);
			if (details && details.channelUri && details.file && details.time) {
				store.dispatch(actions.logFiles.update({
					["channel:" + details.channelUri]: {
						[details.time]: details.file
					}
				}));
			}
		});

		socket.on("userLogFile", (details) => {
			console.log("Received user log file!", details);
			if (details && details.username && details.file && details.time) {
				store.dispatch(actions.logFiles.update({
					["user:" + details.username]: {
						[details.time]: details.file
					}
				}));
			}
		});

		window.socket = socket; // tmp
	}
}
