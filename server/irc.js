// PYRAMID
// IRC module

// Prerequisites
const irc    = require("irc-framework");
const fs     = require("fs");
const path   = require("path");
const lodash = require("lodash");

const constants = require("./constants");
const log = require("./log");
const util = require("./util");

module.exports = function(main) {

	var clients = [], i, multiServerChannels = [], debug = false;

	// "Multi server channels" are channel names that exist on more than one connection,
	// and thus connection needs to be specified upon mention of this channel name,
	// in order to disambiguate.

	// This is usually only performed on startup, however, it is stored as a function,
	// in case it needs to be done later.

	const calibrateMultiServerChannels = function() {
		multiServerChannels = [];

		let namesSeen = [];
		clients.forEach((client) => {
			let channels = client.joinedChannels;
			channels.forEach((channel) => {
				if (namesSeen.indexOf(channel) >= 0) {
					multiServerChannels.push(channel);
				}

				namesSeen.push(channel);
			});
		});
	}

	// Channel objects (chobj); helping easily identify sources of events

	const clientServerName = function(client) {
		if (client && client.config) {
			return client.config.name;
		}

		return null;
	};

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
		return util.getChannelUri(chobj.channel, chobj.server);
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

	const parseMessageTags = function(data) {
		if (data && data.tags) {
			main.plugins().handleEvent("messageTags", data);
			return data.tags;
		}

		return null;
	};

	const formatChannelName = function(channelName) {
		return "#" + channelName.replace(/^#/, "");
	};

	// Send message

	const sendOutgoingMessage = function(channelUri, message, isAction = false) {
		const serverName  = util.channelServerNameFromUrl(channelUri);
		const channelName = util.channelNameFromUrl(channelUri, "#");
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
					client.irc.action(channelName, message);
				} else {
					client.irc.say(channelName, message);
				}

				// Handle our own message as if it's incoming
				handleIncomingMessage(
					client, client.irc.user.nick,
					channelName, type, message, {},
					true
				);
				return true;
			}
		}

		return false;
	};

	// Handle incoming events

	const handleIncomingMessage = function(
		client, username, channel, type, message, tags = {}, postedLocally = false
	) {

		// Context
		const chobj = channelObject(client, channel);
		const channelUri = getChannelUri(chobj);
		const channelName = getChannelFullName(chobj);
		const serverName = chobj.server;
		const meUsername = client.irc.user.nick;

		// Time
		const time = new Date();

		// Parse tags, if any
		const parsedTags = parseMessageTags({
			client, channel: channelUri, message, meUsername,
			postedLocally, serverName, tags, type, username
		});

		main.incomingEvents().handleIncomingMessage(
			channelUri, channelName, serverName, username,
			time, type, message, parsedTags, meUsername
		);
	};

	const handleIncomingEvent = function(client, channel, type, data) {
		const chobj = channelObject(client, channel);
		const time = new Date();

		main.incomingEvents().handleIncomingEvent(
			getChannelUri(chobj), getChannelFullName(chobj), chobj.server,
			type, data, time, client.irc
		);
	};

	const handleIncomingUnhandledMessage = function(client, message) {
		const username = message.nick;
		const channel = message.params[0];
		const chobj = channelObject(client, channel);
		const channelUri = getChannelUri(chobj);
		const serverName = chobj.server;

		main.plugins().handleEvent("customMessage", {
			channel: channelUri,
			client,
			message,
			serverName,
			username
		});
	};

	const handleConnectionStateChange = function(client, state) {
		const server = clientServerName(client);

		if (client._pyramidAborted) {
			state = constants.CONNECTION_STATUS.ABORTED;
		}

		if (server) {
			main.incomingEvents().handleIrcConnectionStateChange(server, state);
		}
	};

	const handleSystemLog = function(client, text, level) {
		const serverName = clientServerName(client);
		main.incomingEvents().handleSystemLog(serverName, text, level);
	};

	const setChannelUserList = function(client, channel, userList) {
		const chobj = channelObject(client, channel);
		const serverName = clientServerName(client);
		main.incomingEvents().handleIncomingUserList(
			getChannelUri(chobj), serverName, userList, client.irc
		);
	};

	const abortClient = function(client, status = constants.CONNECTION_STATUS.ABORTED) {
		client._pyramidAborted = true;
		handleConnectionStateChange(client, status);
	};

	const setUpClient = function(client) {

		client.irc.on("registered", function() {
			let channels = convertChannelObjects(client.config.channels);

			channels.forEach((channel) => {
				client.irc.join(channel);
			});

			client._pyramidAborted = false;
			handleConnectionStateChange(
				client, constants.CONNECTION_STATUS.CONNECTED
			);
			main.plugins().handleEvent("registered", { client });
		});

		client.irc.on("reconnecting", function() {
			handleConnectionStateChange(
				client, constants.CONNECTION_STATUS.DISCONNECTED
			);
		});

		client.irc.on("close", function() {
			// IRC library gave up reconnecting
			handleConnectionStateChange(
				client, constants.CONNECTION_STATUS.FAILED
			);
		});

		client.irc.on("unknown command", function(message) {
			handleIncomingUnhandledMessage(client, message);
		});

		client.irc.on("debug", function (msg) {
			if (debug) {
				console.log(msg);
			}
		});

		client.irc.on("message", function (event) {
			let { nick, message, tags, target, type } = event;
			if (!nick || !target) { return; }
			if (type === "privmsg") { type = "msg"; }
			handleIncomingMessage(
				client, nick, target, type, message, tags
			);
		});

		client.irc.on("error", function(message) {
			let errString = message.commandType + ": " +
				message.params.join(" ") +
				` (${message.command})`;
			handleSystemLog(client, errString, message.commandType);
		});

		client.irc.on("userlist", (event) => {
			let { channel, users } = event;
			console.log("userlist", event);
			setChannelUserList(client, channel, users);
		});

		client.irc.on("join", (event) => {
			let { channel, ident, hostname, nick } = event;

			if (nick === client.irc.user.nick) {
				client.joinedChannels.push(channel);
				console.log("Joined channels list is now " + client.joinedChannels.length);
			}

			handleIncomingEvent(
				client, channel, "join",
				{ username: nick, ident, hostname }
			);

			let channelUri = getChannelUri(channelObject(client, channel));
			main.plugins().handleEvent(
				"join",
				{ client, channel: channelUri, username: nick, ident, hostname }
			);
		});

		client.irc.on("part", (event) => {
			let { channel, nick } = event;

			if (nick === client.irc.user.nick) {
				client.joinedChannels = lodash.without(client.joinedChannels, channel);
				console.log("Joined channels list is now " + client.joinedChannels.length);
			}

			handleIncomingEvent(client, channel, "part", { username: nick });

			let channelUri = getChannelUri(channelObject(client, channel));
			main.plugins().handleEvent(
				"part", { client, channel: channelUri, username: nick }
			);
		});

		client.irc.on("quit", (event) => {
			/*let { nick, message } = event;
			// TODO FIX
			channels.forEach((channel) => {
				handleIncomingEvent(
					client, channel, "quit",
					{ username: nick, reason: message }
				);
			});
			*/
		});

		client.irc.on("kick", (event) => {
			let { kicked, nick, channel, message } = event;
			handleIncomingEvent(
				client, channel, "kick",
				{ username: kicked, by: nick, reason: message }
			);
		});

		client.irc.on("mode", (event) => {
			let { modes, nick, target } = event;

			if (modes && modes.length) {
				modes.forEach((data) => {
					let { mode, param } = data;
					handleIncomingEvent(
						client, target, "mode",
						{ username: nick, mode, argument: param }
					);
				});
			}
		});
	};

	const convertChannelObjects = (channels) => {
		return channels.map((channel) => {
			return "#" + channel.name;
		});
	}

	// Set up clients

	const initiateClient = (cf) => {
		if (cf && cf.hostname) {
			main.log("Connecting to " + cf.hostname + " as " + cf.nickname);
			cf.username = cf.username || cf.nickname;

			let appConfig = main.appConfig();
			debug = appConfig.configValue("debug") || false;

			let c = new irc.Client({
				host:        cf.hostname,
				nick:        cf.nickname,
				port:        cf.port || 6667,
				userName:    cf.username,
				realName:    cf.realname || cf.nickname || cf.username,
				password:    cf.password || "",
				tls:         cf.secure || false,
				rejectUnauthorized: !cf.selfSigned || !cf.certExpired || false,
				auto_reconnect_max_retries: 999
			});
			let client = {
				irc: c,
				config: cf,
				joinedChannels: []
			};
			clients.push(client);
			main.plugins().handleEvent("client", { client });
			c.connect();
		}
	}

	const go = () => {
		const ircConfig = main.ircConfig().currentIrcConfig();
		ircConfig.forEach((config) => {
			if (config) {
				initiateClient(config);
			}
		});

		calibrateMultiServerChannels();

		clients.forEach((client) => {
			if (client) {
				setUpClient(client);
			}
		});
	};

	const connectUnconnectedClients = () => {
		const newNames = [];
		const ircConfig = main.ircConfig().currentIrcConfig();
		ircConfig.forEach((config) => {
			if (
				config &&
				config.name &&
				config.hostname &&
				!findClientByServerName(config.name)
			) {
				initiateClient(config);
				newNames.push(config.name);
			}
		});

		calibrateMultiServerChannels();

		clients.forEach((client) => {
			if (
				client &&
				newNames.indexOf(clientServerName(client)) >= 0
			) {
				setUpClient(client);
			}
		});
	};

	const joinChannel = function(serverName, channelName) {
		const c = findClientByServerName(serverName);
		if (c) {
			c.join(formatChannelName(channelName));
		}
	};

	const partChannel = function(serverName, channelName) {
		const c = findClientByServerName(serverName);
		if (c) {
			c.part(formatChannelName(channelName));
		}
	};

	const reconnectServer = function(serverName) {
		const c = findClientByServerName(serverName);
		if (c && c._pyramidAborted) {
			c.connect();
		}
		else {
			main.warn(
				"Disregarded " + serverName +
				" IRC reconnect request, because client isn't aborted"
			);
		}
	};

	const disconnectServer = function(serverName) {
		const c = findClientByServerName(serverName);
		if (c) {
			abortClient(c);
			c.disconnect();
		}
	};

	const removeServer = function(serverName) {
		const c = findClientByServerName(serverName);
		if (c) {
			disconnectServer(serverName);
			clients = lodash.without(clients, c);
		}
	};

	// Exported objects and methods
	const output = {
		calibrateMultiServerChannels,
		clients: () => clients,
		connectUnconnectedClients,
		disconnectServer,
		go,
		joinChannel,
		partChannel,
		reconnectServer,
		removeServer,
		sendOutgoingMessage
	};

	main.setIrc(output);
	return output;
}
