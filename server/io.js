// PYRAMID
// IO module

// Prerequisites
const socketIo = require("socket.io");

const constants = require("./constants");
const log = require("./log");
const util = require("./util");

module.exports = function(main) {

	var server, io;

	// Pass through
	const emit = () => {
		if (io) {
			return io.emit.apply(io, arguments);
		};

		return null;
	};

	// Direct socket emissions

	const emitChannelCache = function(socket, channelUri) {
		socket.emit("channelCache", {
			channelUri,
			cache: main.getChannelCache(channelUri)
		});
	};

	const emitUserCache = function(socket, username) {
		socket.emit("userCache", {
			username,
			cache: main.getUserCache(username)
		});
	};

	const emitCategoryCache = function(socket, categoryName) {
		socket.emit("categoryCache", {
			categoryName,
			cache: main.getCategoryCache(categoryName)
		});
	};

	const emitChannelLogDetails = function(socket, channelUri) {
		socket.emit("channelLogDetails", {
			channelUri,
			details: log.getChannelLogDetails(channelUri)
		});
	};

	const emitUserLogDetails = function(socket, username) {
		socket.emit("userLogDetails", {
			username,
			details: log.getUserLogDetails(username)
		});
	};

	const emitChannelUserList = function(socket, channelUri) {
		socket.emit("channelUserList", {
			channel: channelUri,
			list: main.getChannelUserList(channelUri)
		});
	};

	const emitChannelLogFile = function(socket, channelUri, time) {
		const ymd = util.ymd(time);
		if (ymd) {
			const [ server, channel ] = channelUri.split("/");
			log.getChatroomLinesForDay(server, channel, time, (err, file) => {
				if (!err) {
					socket.emit("channelLogFile", {
						channelUri,
						file,
						time: ymd
					});
				}
			});
		}
	};

	const emitUserLogFile = function(socket, username, time) {
		const ym = util.ym(time);
		if (ym) {
			log.getUserLinesForMonth(username, time, (err, file) => {
				if (!err) {
					socket.emit("userLogFile", {
						file,
						time: ym,
						username
					});
				}
			});
		}
	};

	// Overall list emissions

	const emitEventToRecipients = function(list, eventName, eventData) {
		if (list) {
			list.forEach((socket) => {
				if (socket) {
					socket.emit(eventName, eventData);
				}
			});
		}
	};

	const emitMessageToRecipients = function(list, msg) {
		emitEventToRecipients(list, "msg", msg);
	};

	const emitEventToChannel = function(channelUri, eventName, eventData) {
		emitEventToRecipients(
			main.getChannelRecipients(channelUri),
			eventName,
			eventData
		);
	};

	const emitUnseenHighlights = function(socket) {
		if (!socket) {
			socket = io;
		}
		if (socket) {
			socket.emit(
				"unseenHighlights",
				{ list: Array.from(main.unseenHighlightIds()) }
			);
		}
	};

	const emitNewHighlight = function(socket, message) {
		if (!socket) {
			socket = io;
		}
		if (socket) {
			socket.emit(
				"newHighlight",
				{ message }
			);
		}
	};

	const emitChannelUserListToRecipients = function(channelUri) {
		emitEventToChannel(channelUri, "channelUserList", {
			channel: channelUri,
			list: main.getChannelUserList(channelUri),
			type: "userlist"
		});
	};

	// Deferred server availability
	const setServer = (_server) => {
		server = _server;

		io = socketIo(server);

		// Update main object with IO support
		setSelf();

		io.on("connection", (socket) => {
			console.log("Someone connected!");

			var connectionToken = null;

			socket.on("disconnect", () => {
				console.log("Someone disconnected!");
			});

			socket.on("token", (details) => {
				if (details && typeof details.token === "string") {
					connectionToken = details.token;

					if (util.isAnAcceptedToken(connectionToken)) {
						emitUnseenHighlights(socket);
					}
				}
			})

			// Respond to requests for cache

			socket.on("requestChannelCache", (channelUri) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (typeof channelUri === "string") {
					emitChannelCache(socket, channelUri);
				}
			});

			socket.on("requestUserCache", (username) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (typeof username === "string") {
					emitUserCache(socket, username);
				}
			});

			socket.on("requestCategoryCache", (categoryName) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (typeof categoryName === "string") {
					emitCategoryCache(socket, categoryName);
				}
			});

			// Response to subscription requests

			socket.on("subscribe", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && details.channel) {
					main.addChannelRecipient(details.channel, socket);
					emitChannelCache(socket, details.channel);
					emitChannelUserList(socket, details.channel);
				}
				else if (details && details.username) {
					main.addUserRecipient(details.username, socket);
					emitUserCache(socket, details.username);
				}
				else if (details && details.category) {
					main.addCategoryRecipient(details.category, socket);
					emitCategoryCache(socket, details.category);
				}
			});

			socket.on("unsubscribe", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && details.channel) {
					main.removeChannelRecipient(details.channel, socket);
				}
				else if (details && details.username) {
					main.removeUserRecipient(details.username, socket);
				}
				else if (details && details.category) {
					main.removeCategoryRecipient(details.category, socket);
				}
			});

			// Response to log requests

			socket.on("requestUserLogDetails", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && typeof details.username === "string") {
					emitUserLogDetails(socket, details.username);
				}
			});

			socket.on("requestChannelLogDetails", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && typeof details.channelUri === "string") {
					emitChannelLogDetails(socket, details.channelUri);
				}
			});

			socket.on("requestUserLogFile", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (
					details &&
					typeof details.username === "string" &&
					typeof details.time === "string"
				) {
					emitUserLogFile(socket, details.username, details.time);
				}
			});

			socket.on("requestChannelLogFile", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (
					details &&
					typeof details.channelUri === "string" &&
					typeof details.time === "string"
				) {
					emitChannelLogFile(socket, details.channelUri, details.time);
				}
			});

			// See an unseen highlight

			socket.on("reportHighlightAsSeen", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && typeof details.messageId === "string") {
					main.reportHighlightAsSeen(details.messageId);
				}
			});

			// Storing view state

			socket.on("storeViewState", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && details.viewState) {
					main.storeViewState(details.viewState);
				}
			});

			// Sending messages

			socket.on("sendMessage", (data) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (data && data.channel && data.message && data.token) {

					// Only allow this socket to send a message
					// if it includes an accepted token

					if (util.isAnAcceptedToken(data.token)) {
						main.sendOutgoingMessage(data.channel, data.message);
					}
				}
			});
		});
	};

	// Send out updates to last seen
	const broadcastLastSeenUpdates = function(){
		if (io) {
			const cachedLastSeens = main.flushCachedLastSeens();
			if (cachedLastSeens) {
				const values = Object.values(cachedLastSeens);
				if (values && values.length) {
					io.emit("lastSeen", values);
				}
			}
		}
	};

	// Am I going to regret this?
	setInterval(broadcastLastSeenUpdates, constants.LAST_SEEN_UPDATE_RATE);

	const output = {
		emit,
		emitChannelUserListToRecipients,
		emitEventToChannel,
		emitMessageToRecipients,
		emitNewHighlight,
		emitUnseenHighlights,
		setServer
	};

	const setSelf = () => {
		main.setIo(output);
	};

	return output;
};
