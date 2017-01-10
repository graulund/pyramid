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
					socket.emit("userCache", {
						username,
						cache: irc.getUserCache(username)
					});
				}
			});
			socket.on("requestChannelCache", (channelUri) => {
				if (typeof channelUri === "string") {
					socket.emit("channelCache", {
						channelUri,
						cache: irc.getChannelCache(channelUri)
					});
				}
			});

			// Sending messages
			socket.on("sendMessage", (data) => {
				if (data && data.channel && data.message) {
					irc.sendOutgoingMessage(data.channel, data.message);
				}
			});
		});
	};

	return {
		setServer: setServer,
		emit: emit
	};
};
