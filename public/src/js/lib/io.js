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

function emitSubscribe(type, subject) {
	if (socket && type && subject) {
		socket.emit("subscribe", { [type]: subject });
		const subscriptionName = subjectName(type, subject);
		currentSubscriptions = [
			...currentSubscriptions, subscriptionName
		];
	}
}

function emitUnsubscribe(type, subject) {
	if (socket && type && subject) {
		socket.emit("unsubscribe", { [type]: subject });
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

export function subscribeToChannel(channelUri) {
	emitSubscribe("channel", channelUri);
}

export function unsubscribeFromChannel(channelUri) {
	emitUnsubscribe("channel", channelUri);
}

export function subscribeToUser(username) {
	emitSubscribe("username", username);
}

export function unsubscribeFromUser(username) {
	emitUnsubscribe("username", username);
}

export function subscribeToCategory(categoryName) {
	emitSubscribe("category", categoryName);
}

export function unsubscribeFromCategory(categoryName) {
	emitUnsubscribe("category", categoryName);
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

export function sendMessage(channelUri, message) {
	if (socket && channelUri && message) {
		const state = store.getState();
		const data = {
			channel: channelUri,
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

export function requestLogDetailsForChannel(channelUri, time) {
	if (socket) {
		socket.emit("requestChannelLogDetails", { channelUri, time });
	}
}

export function requestLogDetailsForUsername(username, time) {
	if (socket) {
		socket.emit("requestUserLogDetails", { username, time });
	}
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

export function requestLogFileForChannel(channelUri, time, pageNumber) {
	if (socket) {
		socket.emit("requestChannelLogFile", { channelUri, pageNumber, time });
	}
}

export function requestLogFileForUsername(username, time, pageNumber) {
	if (socket) {
		socket.emit("requestUserLogFile", { pageNumber, time, username });
	}
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
	if (socket) {
		socket.emit("requestLineInfo", { lineId });
	}
}

export function reportHighlightAsSeen(messageId) {
	if (socket) {
		socket.emit("reportHighlightAsSeen", { messageId });
	}
}

export function storeViewState(viewState) {
	if (socket && viewState) {
		socket.emit("storeViewState", { viewState });
	}
}

function updateLastSeenChannels(channelInfo) {
	store.dispatch(actions.lastSeenChannels.update(channelInfo));
}

function updateLastSeenUsers(userInfo) {
	store.dispatch(actions.lastSeenUsers.update(userInfo));
}

export function addNewFriend(username, level) {
	if (socket) {
		socket.emit("addNewFriend", { username, level });
	}
}

export function changeFriendLevel(username, level) {
	if (socket) {
		socket.emit("changeFriendLevel", { username, level });
	}
}

export function removeFriend(username) {
	if (socket) {
		socket.emit("removeFriend", { username });
	}
}

export function setAppConfigValue(key, value) {
	if (socket) {
		socket.emit("setAppConfigValue", { key, value });
	}
}

export function addIrcServer(name, data) {
	if (socket) {
		socket.emit("addIrcServer", { name, data });
	}
}

export function changeIrcServer(name, data) {
	if (socket) {
		socket.emit("changeIrcServer", { name, data });
	}
}

export function removeIrcServer(name) {
	if (socket) {
		socket.emit("removeIrcServer", { name });
	}
}

export function addIrcChannel(serverName, name) {
	if (socket) {
		socket.emit("addIrcChannel", { serverName, name });
	}
}

export function removeIrcChannel(serverName, name) {
	if (socket) {
		socket.emit("removeIrcChannel", { serverName, name });
	}
}

export function addNickname(nickname) {
	if (socket) {
		socket.emit("addNickname", { nickname });
	}
}

export function changeNicknameValue(nickname, key, value) {
	if (socket) {
		socket.emit("changeNicknameValue", { nickname, key, value });
	}
}

export function removeNickname(nickname) {
	if (socket) {
		socket.emit("removeNickname", { nickname });
	}
}

export function reconnectToIrcServer(name) {
	if (socket) {
		socket.emit("reconnectToIrcServer", { name });
	}
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

		const onChatEvent = (details) => {
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
		};

		socket.on("msg", onChatEvent);
		socket.on("action", onChatEvent);
		socket.on("join", onChatEvent);
		socket.on("part", onChatEvent);
		socket.on("quit", onChatEvent);
		socket.on("kick", onChatEvent);
		socket.on("kill", onChatEvent);
		socket.on("events", onChatEvent);

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
							const { username, time } = details.data;
							channelUpdates[details.channel] = { username, time };
							channelsDirty = true;
						}
						else if (details.username) {
							const { channel, time } = details.data;
							userUpdates[details.username] = { channel, time };
							usersDirty = true;
						}
					}
				});

				if (channelsDirty) {
					updateLastSeenChannels(channelUpdates);
				}
				if (usersDirty) {
					updateLastSeenUsers(userUpdates);
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
			if (details && details.channelUri && details.cache) {
				store.dispatch(actions.channelCaches.update({
					[details.channelUri]: details.cache
				}));
			}
		});

		socket.on("userCache", (details) => {
			if (details && details.username && details.cache) {
				store.dispatch(actions.userCaches.update({
					[details.username]: details.cache
				}));
			}
		});

		socket.on("categoryCache", (details) => {
			if (details && details.categoryName && details.cache) {
				store.dispatch(actions.categoryCaches.update({
					[details.categoryName]: details.cache
				}));
			}
		});

		socket.on("channelLogDetails", (details) => {
			if (details && details.channelUri && details.details) {
				let subject = subjectName("channel", details.channelUri);
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
			if (details && details.channelUri && details.file && details.time) {
				let subject = subjectName("channel", details.channelUri);
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

		// Data store refreshes

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

		socket.on("appConfig", (details) => {
			if (details && details.data) {
				console.log("Received appConfig", details);
				store.dispatch(actions.appConfig.update(details.data));
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

	}
}
