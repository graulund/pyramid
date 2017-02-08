// PYRAMID
// IRC module

// Prerequisites
const irc    = require("irc");
const fs     = require("fs");
const path   = require("path");

const config = require("../config");
const constants = require("./constants");
const log = require("./log");
const util = require("./util");

module.exports = function(main) {

	var clients = [], i, multiServerChannels = [];

	// "Multi server channels" are channel names that exist on more than one connection,
	// and thus connection needs to be specified upon mention of this channel name,
	// in order to disambiguate.

	// This is usually only performed on startup, however, it is stored as a function,
	// in case it needs to be done later.

	var calibrateMultiServerChannels = function() {
		multiServerChannels = [];

		var namesSeen = [];
		for (var i = 0; i < clients.length; i++) {
			var c = clients[i];

			for (var j = 0; j < c.opt.channels.length; j++) {
				var ch = c.opt.channels[j];

				if (namesSeen.indexOf(ch) >= 0) {
					multiServerChannels.push(ch);
				}

				namesSeen.push(ch);
			}
		}
	}

	// Channel objects (chobj); helping easily identify sources of events

	const clientServerName = function(client) {
		if (client && client.extConfig) {
			return client.extConfig.name;
		}

		return null;
	}

	const isTwitch = function(client) {
		if (client && client.extConfig) {
			return /irc\.(chat\.)?twitch\.tv/.test(client.extConfig.server);
		}

		return null;
	}

	const channelObject = function(client, channel) {
		// "server" idenfitier is not actually server address;
		// merely the identifying name given in its config section
		return {
			server: clientServerName(client),
			channel: channel,
			client: client
		}
	};

	const getChannelUri = function(chobj) {

		var safeString = function(str){
			return str.replace(/[^a-zA-Z0-9_-]+/g, "");
		}

		var c = safeString(chobj.channel);

		if (chobj.server) {
			return path.join(safeString(chobj.server), c);
		}

		return c;
	};

	const getChannelFullName = function(chobj) {

		if (multiServerChannels.indexOf(chobj.channel) >= 0) {
			return chobj.server + " " + chobj.channel;
		}

		return chobj.channel;
	};

	const findClientByServerName = function(serverName) {
		for(var i = 0; i < clients.length; i++){
			var c = clients[i]
			if (clientServerName(c) === serverName) {
				return c;
			}
		}
		return null;
	};

	const parseSingleEmoticonIndices = function(data) {
		// 25:11-15,23-27

		const seqs = data.split(":");

		if (seqs.length > 1) {
			const number = seqs[0], indicesString = seqs[1];
			const indices = indicesString.split(",").map((nums) => {
				const i = nums.split("-");
				return {
					start: parseInt(i[0], 10),
					end: parseInt(i[1], 10)
				};
			});
			return { number, indices };
		}

		return null;
	};

	const parseEmoticonIndices = function(dataString) {
		// 1902:17-21,29-33/25:11-15,23-27

		const emoteDatas = dataString.split("/");
		return emoteDatas.map(parseSingleEmoticonIndices);
	};

	const parseMessageTags = function(tags) {
		if (tags) {
			if (typeof tags.emotes === "string") {
				tags.emotes = parseEmoticonIndices(tags.emotes);
			}

			return tags;
		}

		return null;
	};

	// Send message

	const sendOutgoingMessage = function(channelUri, message, isAction = false) {
		const serverName  = util.channelServerNameFromUrl(channelUri);
		const channelName = util.channelNameFromUrl(channelUri);
		if (serverName && channelName) {
			const client = findClientByServerName(serverName);
			if (client) {

				const meRegex = /^\/me\s+/;
				if (!isAction && meRegex.test(message)) {
					isAction = true;
					message = message.replace(meRegex, "");
				}

				const type = isAction ? "action" : "msg";

				if (isAction) {
					client.action(channelName, message);
				} else {
					client.say(channelName, message);
				}
				// Handle our own message as if it's incoming
				handleIncomingMessage(
					client, client.extConfig.username,
					channelName, type, message
				);
				return true;
			}
		}

		return false;
	};

	// Handle incoming events

	const handleIncomingMessage = function(client, username, channel, type, message, tags) {

		// Channel object
		const chobj = channelObject(client, channel);
		const channelUri = getChannelUri(chobj);
		const channelName = getChannelFullName(chobj);
		const serverName = chobj.server;

		// Time
		const time = new Date();

		main.handleIncomingMessage(
			channelUri, channelName, serverName, username,
			time, type, message, parseMessageTags(tags),
			client.extConfig.me
		);
	};

	const handleIncomingEvent = function(client, channel, type, data) {
		const chobj = channelObject(client, channel);
		const time = new Date();

		main.handleIncomingEvent(
			getChannelUri(chobj), getChannelFullName(chobj), chobj.server,
			type, data, time, client.chans[channel].users
		);
	};

	const setChannelUserList = function(client, channel, userList) {
		const chobj = channelObject(client, channel);
		main.setChannelUserList(getChannelUri(chobj), userList);
	};

	const setUpClient = function(client) {

		if (isTwitch(client)) {
			// TODO: Separate out into file
			client.send("CAP", "REQ", "twitch.tv/membership");
			client.send("CAP", "REQ", "twitch.tv/commands");
			client.send("CAP", "REQ", "twitch.tv/tags");
		}

		client.addListener("motd", function (message) {
			// In a standard IRC network, prefix info should be non-empty by now
			// Try to insert some very basic standrd info iff it's empty
			try {
				if (
					client.prefixForMode && client.modeForPrefix
				) {
					const pfmKeys = Object.keys(client.prefixForMode);
					const mfpKeys = Object.keys(client.modeForPrefix);

					if (pfmKeys && mfpKeys && !pfmKeys.length && !mfpKeys.length) {
						client.prefixForMode["o"] = "@";
						client.modeForPrefix["@"] = "o";
					}
				}
			}
			catch(e) {}
		});

		client.addListener("message", function (username, channel, message, rawData) {
			handleIncomingMessage(
				client, username, channel, "msg", message, rawData.tags
			);
		});

		client.addListener("action", function (username, channel, message, rawData) {
			handleIncomingMessage(
				client, username, channel, "action", message, rawData.tags
			);
		});

		client.addListener("error", function(message) {
			main.handleChatNetworkError(message);
		});

		client.addListener("names", (channel, nicks) => {
			setChannelUserList(client, channel, nicks);
		});

		client.addListener("join", (channel, username) => {
			handleIncomingEvent(client, channel, "join", { username });
		});

		client.addListener("part", (channel, username, reason) => {
			handleIncomingEvent(client, channel, "part", { username, reason });
		});

		client.addListener("quit", (username, reason, channels) => {
			channels.forEach((channel) => {
				handleIncomingEvent(
					client, channel, "quit", { username, reason }
				);
			});
		});

		client.addListener("kick", (channel, username, by, reason) => {
			handleIncomingEvent(client, channel, "kick", { username, by, reason });
		});

		client.addListener("+mode", (channel, username, mode, argument) => {
			handleIncomingEvent(
				client, channel, "+mode", { username, mode, argument }
			);
		});

		client.addListener("-mode", (channel, username, mode, argument) => {
			handleIncomingEvent(
				client, channel, "-mode", { username, mode, argument }
			);
		});

		client.addListener("kill", (username, reason, channels) => {
			channels.forEach((channel) => {
				handleIncomingEvent(
					client, channel, "kill", { username, reason }
				);
			});
		});
	};

	// Set up clients

	for(i = 0; i < config.irc.length; i++){
		var cf = config.irc[i];
		console.log("Connecting to " + cf.server + " as " + cf.username);

		var c = new irc.Client(
			cf.server, cf.username,
			{
				channels:    cf.channels,
				port:        cf.port || 6667,
				userName:    cf.username,
				realName:    cf.realname || cf.username,
				password:    cf.password || "",
				secure:      cf.secure || false,
				selfSigned:  cf.selfSigned || false,
				certExpired: cf.certExpired || false,
				debug:       config.debug,
				showErrors:  config.debug,
				retryCount:  999
			}
		);
		c.extConfig = cf;
		clients.push(c);
	}

	calibrateMultiServerChannels();

	for (i = 0; i < clients.length; i++) {
		var client = clients[i];
		if (client) {
			setUpClient(client);
		}
	}

	// Exported objects and methods
	const output = {
		client,
		calibrateMultiServerChannels,
		sendOutgoingMessage
	};

	main.setIrc(output);
	return output;
}
