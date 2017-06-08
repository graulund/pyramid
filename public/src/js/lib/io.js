import actions from "../actions";
import store from "../store";
import pull from "lodash/pull";
import without from "lodash/without";

import { CACHE_LINES, PAGE_TYPES } from "../constants";
import { setGlobalConnectionStatus, STATUS } from "./connectionStatus";
import { sendMessageNotification } from "./notifications";
import {
	categoryUrl, channelUrl, parseSubjectName, subjectName, userUrl
} from "./routeHelpers";

var io;
var socket;

var currentSubscriptions = [];

function emit(name, value) {
	if (socket) {
		socket.emit(name, value);
	}
}

function emitSubscribe(type, subject) {
	if (socket && type && subject) {
		emit("subscribe", { [type]: subject });
		const subscriptionName = subjectName(type, subject);
		currentSubscriptions = [
			...currentSubscriptions, subscriptionName
		];
	}
}

function emitUnsubscribe(type, subject) {
	if (socket && type && subject) {
		emit("unsubscribe", { [type]: subject });
		const subscriptionName = subjectName(type, subject);
		currentSubscriptions = without(
			currentSubscriptions, subscriptionName
		);
	}
}

function emitCurrentSubscriptions() {
	currentSubscriptions.forEach((sub) => {
		const { type, query } = parseSubjectName(sub);
		emitSubscribe(type, query);
	});
}

function _handleSubscription(subject, unsubscribe = false) {
	const { type, query } = parseSubjectName(subject);
	const typeName = type === "user" ? "username" : type;

	if (unsubscribe) {
		emitUnsubscribe(typeName, query);
	}
	else {
		emitSubscribe(typeName, query);
	}
}

export function subscribeToSubject(subject) {
	_handleSubscription(subject, false);
}

export function unsubscribeFromSubject(subject) {
	_handleSubscription(subject, true);
}

export function sendMessage(channel, message) {
	if (socket && channel && message) {
		const state = store.getState();
		const data = {
			channel,
			message,
			token: state && state.token
		};

		emit("sendMessage", data);
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
		cache = cache.slice(cache.length - CACHE_LINES);
	}

	return cache;
}

export function clearReplacedIdsFromCache(cache, prevIds) {
	if (cache && cache.length && prevIds && prevIds.length) {
		const itemsWithPrevIds = cache.filter(
			(item) => prevIds.indexOf(item.lineId) >= 0
		);
		return pull(cache, ...itemsWithPrevIds);

		// NOTE: We are modifiying in place to prevent too many change handlers from
		// occuring. We are expecting the caller to create a new array with an added
		// item immediately after having called this method.
	}

	return cache;
}

export function requestLogDetailsForChannel(channel, time) {
	emit("requestChannelLogDetails", { channel, time });
}

export function requestLogDetailsForUsername(username, time) {
	emit("requestUserLogDetails", { username, time });
}

export function requestLogDetails(subject, time) {
	const { type, query } = parseSubjectName(subject);
	switch(type) {
		case PAGE_TYPES.CHANNEL:
			return requestLogDetailsForChannel(query, time);
		case PAGE_TYPES.USER:
			return requestLogDetailsForUsername(query, time);
	}
}

export function requestLogFileForChannel(channel, time, pageNumber) {
	emit("requestChannelLogFile", { channel, pageNumber, time });
}

export function requestLogFileForUsername(username, time, pageNumber) {
	emit("requestUserLogFile", { pageNumber, time, username });
}

export function requestLogFile(subject, time, pageNumber) {
	const { type, query } = parseSubjectName(subject);
	switch(type) {
		case PAGE_TYPES.CHANNEL:
			return requestLogFileForChannel(query, time, pageNumber);
		case PAGE_TYPES.USER:
			return requestLogFileForUsername(query, time, pageNumber);
	}
}

export function requestLineInfo(lineId) {
	emit("requestLineInfo", { lineId });
}

export function requestSystemInfo() {
	emit("requestSystemInfo");
}

export function requestBaseDataReload() {
	emit("reloadBaseData");
}

export function reportHighlightAsSeen(messageId) {
	emit("reportHighlightAsSeen", { messageId });
}

export function storeViewState(viewState) {
	if (viewState) {
		emit("storeViewState", { viewState });
	}
}

export function addNewFriend(username, level) {
	emit("addNewFriend", { username, level });
}

export function changeFriendLevel(username, level) {
	emit("changeFriendLevel", { username, level });
}

export function removeFriend(username) {
	emit("removeFriend", { username });
}

export function setAppConfigValue(key, value) {
	emit("setAppConfigValue", { key, value });
}

export function addIrcServer(name, data) {
	emit("addIrcServer", { name, data });
}

export function changeIrcServer(name, data) {
	emit("changeIrcServer", { name, data });
}

export function removeIrcServer(name) {
	emit("removeIrcServer", { name });
}

export function addIrcChannel(serverName, name) {
	emit("addIrcChannel", { serverName, name });
}

export function removeIrcChannel(serverName, name) {
	emit("removeIrcChannel", { serverName, name });
}

export function addNickname(nickname) {
	emit("addNickname", { nickname });
}

export function changeNicknameValue(nickname, key, value) {
	emit("changeNicknameValue", { nickname, key, value });
}

export function removeNickname(nickname) {
	emit("removeNickname", { nickname });
}

export function reconnectToIrcServer(name) {
	emit("reconnectToIrcServer", { name });
}

export function clearUnseenHighlights() {
	emit("clearUnseenHighlights");
}

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

		socket.on("error", () => {
			console.warn("Socket connection error occurred");
		});

		socket.on("disconnect", () => {
			console.warn("Socket disconnected");
			setGlobalConnectionStatus(STATUS.DISCONNECTED);
		});

		socket.on("reconnect", () => {
			console.log("Socket reconnected");
			setGlobalConnectionStatus(STATUS.CONNECTED);
			emitCurrentSubscriptions();
			requestBaseDataReload();
		});

		socket.on("reconnect_attempt", () => {
			console.log("Socket attempting to reconnect");
		});

		socket.on("reconnecting", () => {
			console.log("Socket reconnecting");
		});

		socket.on("reconnect_error", () => {
			console.warn("Socket reconnection error occurred");
		});

		socket.on("reconnect_failed", () => {
			// TODO: Set up interval to try to reconnect every now and then
			// TODO: Set up button for user to force reconnect attempt now
			console.warn("Socket reconnection failed");
		});

		socket.on("tokenStatus", (details) => {
			const status = details.isAccepted ? STATUS.CONNECTED : STATUS.REJECTED;
			setGlobalConnectionStatus(status);
		});

		socket.on("channelEvent", (details) => {
			const { channel, highlight, relationship, type, username } = details;

			// Only add chat messages to store if we're actually viewing
			// their respective stores, otherwise we'll get the whole
			// thing when we request subscription, so it doesn't really matter

			if (location.pathname === channelUrl(channel)) {
				store.dispatch(actions.channelCaches.append(details));
			}

			if (
				location.pathname === categoryUrl("highlights") &&
				highlight && highlight.length
			) {
				store.dispatch(actions.categoryCaches.append({
					categoryName: "highlights",
					item: details
				}));
			}

			if (!relationship || (type !== "msg" && type !== "action")) {
				return;
			}

			if (location.pathname === userUrl(username)) {
				store.dispatch(actions.userCaches.append(details));
			}

			if (location.pathname === categoryUrl("allfriends")) {
				store.dispatch(actions.categoryCaches.append({
					categoryName: "allfriends",
					item: details
				}));
			}
		});

		socket.on("channelUserList", (details) => {
			if (details && details.channel && details.list) {
				store.dispatch(actions.channelUserLists.update({
					[details.channel]: details.list
				}));
			}
		});

		socket.on("lastSeen", (instances) => {
			if (instances && instances.length) {
				var channelUpdates = {}, userUpdates = {},
					channelsDirty = false, usersDirty = false;

				instances.forEach((details) => {
					if (details.data) {
						if (details.channel) {
							let { username, time, userDisplayName } = details.data;
							channelUpdates[details.channel] =
								{ username, time, userDisplayName };
							channelsDirty = true;
						}
						else if (details.username) {
							let { channel, time, displayName } = details.data;
							userUpdates[details.username] =
								{ channel, time, displayName };
							usersDirty = true;
						}
					}
				});

				if (channelsDirty) {
					store.dispatch(actions.lastSeenChannels.update(channelUpdates));
				}

				if (usersDirty) {
					store.dispatch(actions.lastSeenUsers.update(userUpdates));
				}
			}
		});

		socket.on("connectionStatus", (details) => {
			if (details && details.serverName) {
				store.dispatch(actions.connectionStatus.update({
					[details.serverName]: details.status
				}));
			}
		});

		socket.on("channelCache", (details) => {
			let cache = details && details.cache || [];
			if (details && details.channel) {
				store.dispatch(actions.channelCaches.update(
					details.channel, cache
				));
			}
		});

		socket.on("userCache", (details) => {
			let cache = details && details.cache || [];
			if (details && details.username) {
				store.dispatch(actions.userCaches.update(
					details.username, cache
				));
			}
		});

		socket.on("categoryCache", (details) => {
			let cache = details && details.cache || [];
			if (details && details.categoryName) {
				store.dispatch(actions.categoryCaches.update(
					details.categoryName, cache
				));
			}
		});

		socket.on("channelLogDetails", (details) => {
			if (details && details.channel && details.details) {
				let subject = subjectName("channel", details.channel);
				store.dispatch(actions.logDetails.update({
					[subject]: details.details
				}));
			}
		});

		socket.on("userLogDetails", (details) => {
			if (details && details.username && details.details) {
				let subject = subjectName("user", details.username);
				store.dispatch(actions.logDetails.update({
					[subject]: details.details
				}));
			}
		});

		socket.on("channelLogFile", (details) => {
			if (details && details.channel && details.file && details.time) {
				let subject = subjectName("channel", details.channel);
				store.dispatch(actions.logFiles.update(
					subject,
					details.time,
					details.file
				));
			}
		});

		socket.on("userLogFile", (details) => {
			if (details && details.username && details.file && details.time) {
				let subject = subjectName("user", details.username);
				store.dispatch(actions.logFiles.update(
					subject,
					details.time,
					details.file
				));
			}
		});

		socket.on("unseenHighlights", (details) => {
			if (details && details.list) {
				store.dispatch(actions.unseenHighlights.set(details.list));
			}
		});

		socket.on("newHighlight", (details) => {
			if (details && details.message) {
				// TODO: Don't alert if the window is in focus and you're viewing a source where this appears
				sendMessageNotification(details.message);
			}
		});

		socket.on("lineInfo", (details) => {
			if (details && details.line && details.line.lineId) {
				store.dispatch(actions.lineInfo.update({
					[details.line.lineId]: details.line
				}));
			}
		});

		socket.on("systemInfo", (details) => {
			if (details && details.key) {
				store.dispatch(actions.systemInfo.update({
					[details.key]: details.value
				}));
			}
		});

		socket.on("channelData", (details) => {
			if (details && details.channel) {
				store.dispatch(actions.channelData.update(
					details.channel, details.data
				));
			}
		});

		socket.on("serverData", (details) => {
			if (details && details.server) {
				store.dispatch(actions.serverData.update(
					details.server, details.data
				));
			}
		});

		// Data store refreshes

		socket.on("appConfig", (details) => {
			if (details && details.data) {
				console.log("Received appConfig", details);
				store.dispatch(actions.appConfig.update(details.data));
			}
		});

		socket.on("friendsList", (details) => {
			if (details && details.data) {
				console.log("Received friendsList", details);
				store.dispatch(actions.friendsList.set(details.data));
			}
		});

		socket.on("ircConfig", (details) => {
			if (details && details.data) {
				console.log("Received ircConfig", details);
				store.dispatch(actions.ircConfigs.set(details.data));
			}
		});

		socket.on("nicknames", (details) => {
			if (details && details.data) {
				console.log("Received nicknames", details);
				store.dispatch(actions.nicknames.set(details.data));
			}
		});

		socket.on("onlineFriends", (details) => {
			if (details && details.data) {
				console.log("Received onlineFriends", details);
				store.dispatch(actions.onlineFriends.set(details.data));
			}
		});

		socket.on("viewState", (details) => {
			if (details && details.data) {
				console.log("Received viewState", details);
				store.dispatch(actions.viewState.update(details.data));
			}
		});

	}
}
