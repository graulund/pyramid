// PYRAMID
// IO module

// Prerequisites
var socketIo = require("socket.io");

// Constants
const RELATIONSHIP_NONE = 0;
const RELATIONSHIP_FRIEND = 1;
const RELATIONSHIP_BEST_FRIEND = 2;

module.exports = function(config, util, log, irc) {

	var server, io;

	// Pass through
	var emit = () => {
		if (io) {
			return io.emit.apply(io, arguments);
		};

		return null;
	};

	var sendChannelCache = function(socket, channelUri) {
		socket.emit("channelCache", {
			channelUri,
			cache: irc.getChannelCache(channelUri)
		});
	};

	var sendUserCache = function(socket, username) {
		socket.emit("userCache", {
			username,
			cache: irc.getUserCache(username)
		});
	};

	var sendChannelLogDetails = function(socket, channelUri) {
		socket.emit("channelLogDetails", {
			channelUri,
			details: log.getChannelLogDetails(channelUri)
		});
	};

	var sendUserLogDetails = function(socket, username) {
		socket.emit("userLogDetails", {
			username,
			details: log.getUserLogDetails(username)
		});
	};

	var sendChannelUserList = function(socket, channelUri) {
		socket.emit("channelUserList", {
			channel: channelUri,
			list: irc.getChannelUserList(channelUri)
		});
	};

	var sendChannelLogFile = function(socket, channelUri, time) {
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

	var sendUserLogFile = function(socket, username, time) {
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

	// Deferred server availability
	var setServer = (_server) => {
		server = _server;

		io = require("socket.io")(server);

		// Update IRC object with IO support
		irc.setIo(io);

		io.on("connection", (socket) => {
			console.log("Someone connected!");

			var connectionToken = null;

			socket.on("disconnect", () => {
				console.log("Someone disconnected!");
			});

			socket.on("token", (details) => {
				if (details && typeof details.token === "string") {
					connectionToken = details.token;
				}
			})

			// Respond to requests for cache
			socket.on("requestUserCache", (username) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (typeof username === "string") {
					sendUserCache(socket, username);
				}
			});
			socket.on("requestChannelCache", (channelUri) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (typeof channelUri === "string") {
					sendChannelCache(socket, channelUri);
				}
			});

			// Response to subscription requests
			socket.on("subscribe", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && details.channel) {
					irc.addChannelRecipient(details.channel, socket);
					sendChannelCache(socket, details.channel);
					sendChannelUserList(socket, details.channel);
				}
				else if (details && details.username) {
					irc.addUserRecipient(details.username, socket);
					sendUserCache(socket, details.username);
				}
			});
			socket.on("unsubscribe", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && details.channel) {
					irc.removeChannelRecipient(details.channel, socket);
				}
				else if (details && details.username) {
					irc.removeUserRecipient(details.username, socket);
				}
			});

			// Response to log requests
			socket.on("requestUserLogDetails", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && typeof details.username === "string") {
					sendUserLogDetails(socket, details.username);
				}
			});
			socket.on("requestChannelLogDetails", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (details && typeof details.channelUri === "string") {
					sendChannelLogDetails(socket, details.channelUri);
				}
			});
			socket.on("requestUserLogFile", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (
					details &&
					typeof details.username === "string" &&
					typeof details.time === "string"
				) {
					sendUserLogFile(socket, details.username, details.time);
				}
			});
			socket.on("requestChannelLogFile", (details) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (
					details &&
					typeof details.channelUri === "string" &&
					typeof details.time === "string"
				) {
					sendChannelLogFile(socket, details.channelUri, details.time);
				}
			});

			// Sending messages
			socket.on("sendMessage", (data) => {
				if (!util.isAnAcceptedToken(connectionToken)) { return; }
				if (data && data.channel && data.message && data.token) {

					// Only allow this socket to send a message
					// if it includes an accepted token

					if (util.isAnAcceptedToken(data.token)) {
						irc.sendOutgoingMessage(data.channel, data.message);
					}
				}
			});
		});
	};

	return {
		setServer: setServer,
		emit: emit
	};
};
