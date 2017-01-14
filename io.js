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
	}

	// Deferred server availability
	var setServer = (_server) => {
		server = _server;

		io = require("socket.io")(server);

		// Update IRC object with IO support
		irc.setIo(io);

		io.on("connection", (socket) => {
			console.log("Someone connected!");
			socket.on("disconnect", () => {
				console.log("Someone disconnected!");
			});

			// Respond to requests for cache
			socket.on("requestUserCache", (username) => {
				if (typeof username === "string") {
					sendUserCache(socket, username);
				}
			});
			socket.on("requestChannelCache", (channelUri) => {
				if (typeof channelUri === "string") {
					sendChannelCache(socket, channelUri);
				}
			});

			// Response to subscription requests
			socket.on("subscribe", (details) => {
				if (details.channel) {
					irc.addChannelRecipient(details.channel, socket);
					sendChannelCache(socket, details.channel);
				}
				else if (details.username) {
					irc.addUserRecipient(details.username, socket);
					sendUserCache(socket, details.username);
				}
			});
			socket.on("unsubscribe", (details) => {
				if (details.channel) {
					irc.removeChannelRecipient(details.channel, socket);
				}
				else if (details.username) {
					irc.removeUserRecipient(details.username, socket);
				}
			});

			// Sending messages
			socket.on("sendMessage", (data) => {
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
