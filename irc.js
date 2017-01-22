// IRC WATCHER
// IRC module

// Prerequisites
var irc    = require("irc"),
	fs     = require("fs"),
	mkdirp = require("mkdirp"),
	path   = require("path"),
	lodash = require("lodash"),
	uuid   = require("node-uuid")

// Constants
const RELATIONSHIP_NONE = 0;
const RELATIONSHIP_FRIEND = 1;
const RELATIONSHIP_BEST_FRIEND = 2;

const CACHE_LINES = 150;
const LAST_SEEN_UPDATE_RATE = 500;

const USER_MODIFYING_EVENT_TYPES =
	["join", "part", "quit", "kick", "kill", "+mode", "-mode"];
const PART_EVENT_TYPES =
	["part", "quit", "kick", "kill"];
const BUNCHABLE_EVENT_TYPES =
	["join", "part", "quit", "kill", "+mode", "-mode"];

module.exports = function(config, util, log){

	var io = {} // To be filled in later

	// Load last seen info

	var loadLastSeenInfo = function(fileName) {
		var json = "";
		try {
			json = fs.readFileSync(fileName);
		} catch(err) {
			// Create empty file
			var fd = fs.openSync(fileName, "w");
			fs.closeSync(fd);
		}

		var output = {};
		try {
			output = JSON.parse(json);
		} catch(e){}

		return output || {};
	}

	var lastSeenChannelsFileName = path.join(__dirname, "lastSeenChannels.json");
	var lastSeenUsersFileName = path.join(__dirname, "lastSeenUsers.json");

	var lastSeenChannels = loadLastSeenInfo(lastSeenChannelsFileName);
	var lastSeenUsers = loadLastSeenInfo(lastSeenUsersFileName);

	var channelUserLists = {};

	var channelCaches = {};
	var userCaches = {};

	var channelRecipients = {};
	var userRecipients = {};

	var cachedLastSeens = {};

	// Set up IRC

	var clients = [], i, multiServerChannels = [];

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

	// "Multi server channels" are channel names that exist on more than one connection,
	// and thus connection needs to be specified upon mention of this channel name,
	// in order to disambiguate.

	// This is usually only performed on startup, however, it is stored as a function,
	// in case it needs to be done later.

	var calibrateMultiServerChannels = function(){
		multiServerChannels = []
		var namesSeen = []
		for(var i = 0; i < clients.length; i++){
			var c = clients[i]
			for(var j = 0; j < c.opt.channels.length; j++){
				var ch = c.opt.channels[j]
				if(namesSeen.indexOf(ch) >= 0){
					multiServerChannels.push(ch)
				}
				namesSeen.push(ch)
			}
		}
	}
	calibrateMultiServerChannels()

	/** /client.addListener("raw", function(message){
		console.log("<< ", message)
	})/**/

	// Channel objects (chobj); helping easily identify sources of events

	var channelObject = function(client, channel){
		var server = ""
		if(typeof client == "object" && "extConfig" in client){
			// "server" idenfitier is not actually server address;
			// merely the identifying name given in its config section
			server = client.extConfig.name
		}
		return {
			server: server,
			channel: channel,
			client: client
		}
	}

	var channelFileName = function(chobj){

		var safeString = function(str){
			return str.replace(/[^a-zA-Z0-9_-]+/g, "")
		}

		var c = safeString(chobj.channel)

		if(chobj.server){
			return path.join(safeString(chobj.server), c)
		}

		return c
	}

	var channelFullName = function(chobj){

		if(multiServerChannels.indexOf(chobj.channel) >= 0){
			return chobj.server + " " + chobj.channel
		}

		return chobj.channel
	}

	var cfnPrefix = function(str, chobj){
		return "[" + channelFullName(chobj) + "] " + str
	}

	var findClientByServerName = function(serverName) {
		for(var i = 0; i < clients.length; i++){
			var c = clients[i]
			if (c.extConfig && c.extConfig.name === serverName) {
				return c;
			}
		}
		return null;
	};

	//TODO: Move parts of "logLine" to log object
	var logLine = function(chobj, line, d, filename){

		// Optional argument; log filename for special logs
		if(typeof filename != "string"){
			filename = ""
		}

		if(filename){
			line = util.ymdhmsPrefix(line, d)
		} else {
			line = util.hmsPrefix(line, d)
		}

		// DEBUG output
		if(config.debug && !filename){
			console.log(cfnPrefix(line, chobj))
		}

		// Specify room in non-room logs
		if(filename){
			line = cfnPrefix(line, chobj)
		}

		// Determine log folders
		var logDir = path.join(__dirname, "public", "data", "logs")
		var ymText = util.ym(d)
		if(filename){
			logDir = path.join(logDir, "_global", ymText)
		} else {
			var c = channelFileName(chobj)
			logDir = path.join(logDir, c, ymText)
		}

		mkdirp(logDir, function(err){
			if(err){
				throw err
			}
			var fn = filename ? filename : util.ymd(d)
			fs.appendFile(
				path.join(logDir, fn + ".txt"),
				line + "\n",
				{ encoding: config.encoding },
				function(err){
					if(err){
						throw err
					}
					// It was appended to the file!
				}
			)
		})
	};

	var writeLastSeen = function(fileName, data) {
		fs.writeFile(
			fileName,
			JSON.stringify(data),
			{ encoding: config.encoding },
			function(err){
				if(err){
					throw err
				}
				// It was written!
			}
		);
	};

	var updateLastSeen = function(chobj, username, time, message, isAction, relationship) {
		var channel = channelFileName(chobj), channelName = channelFullName(chobj);

		lastSeenChannels[channel] = {
			username,
			time
		};
		writeLastSeen(lastSeenChannelsFileName, lastSeenChannels);

		cachedLastSeens[`channel:${channel}`] = { channel, data: lastSeenChannels[channel] };

		if (relationship >= RELATIONSHIP_FRIEND) {
			lastSeenUsers[username] = {
				channel,
				channelName,
				time
			};
			writeLastSeen(lastSeenUsersFileName, lastSeenUsers);

			cachedLastSeens[`user:${username}`] = { username, data: lastSeenUsers[username] };
		}
	};

	var emitEventToRecipients = function(list, eventName, eventData) {
		if (list) {
			list.forEach((socket) => {
				if (socket) {
					socket.emit(eventName, eventData);
				}
			});
		}
	};

	var emitMessageToRecipients = function(list, msg) {
		emitEventToRecipients(list, "msg", msg);
	};

	var emitEventToChannel = function(channelUrl, eventName, eventData) {
		emitEventToRecipients(channelRecipients[channelUrl], eventName, eventData);
	};

	var cacheItem = function(cache, data) {
		// Add it
		cache.push(data);

		// And make sure we only have the maximum amount
		if (cache.length > CACHE_LINES) {
			if (cache.length === CACHE_LINES + 1) {
				cache.shift();
			} else {
				cache = cache.slice(cache.length - CACHE_LINES);
			}
		}
	};

	var cacheChannelEvent = function(channelUrl, data) {
		if (!channelCaches[channelUrl]) {
			channelCaches[channelUrl] = [];
		}
		cacheItem(channelCaches[channelUrl], data);

		// Emit
		emitEventToChannel(channelUrl, data.type, data);
	};

	var cacheUserMessage = function(username, msg) {
		if (!userCaches[username]) {
			userCaches[username] = [];
		}
		cacheItem(userCaches[username], msg);

		// Emit
		emitMessageToRecipients(userRecipients[username], msg);
	};

	var cacheBunchableChannelEvent = function(channelUrl, data) {
		const cache = channelCaches[channelUrl];
		if (cache && cache.length) {
			const lastIndex = cache.length-1;
			const lastItem = cache[lastIndex];
			if (lastItem) {
				var bunch;
				if (BUNCHABLE_EVENT_TYPES.indexOf(lastItem.type) >= 0) {
					// Create bunch and insert in place
					cache[lastIndex] = bunch = {
						channel: lastItem.channel,
						channelName: lastItem.channelName,
						events: [lastItem, data],
						id: uuid.v4(),
						prevIds: [lastItem.id],
						server: lastItem.server,
						time: data.time,
						type: "events"
					};
				}
				else if (lastItem.type === "events") {
					// Add to bunch, resulting in a new, inserted in place
					cache[lastIndex] = bunch = {
						channel: lastItem.channel,
						channelName: lastItem.channelName,
						events: lastItem.events.concat([data]),
						id: uuid.v4(),
						prevIds: lastItem.prevIds.concat([lastItem.id]),
						server: lastItem.server,
						time: data.time,
						type: "events"
					};
				}
				if (bunch) {
					emitEventToChannel(channelUrl, bunch.type, bunch);
					return;
				}
			}
		}

		// Otherwise, just a normal addition to the list
		cacheChannelEvent(channelUrl, data);
	};

	var emitMessage = function(
		chobj, from, time, message, isAction,
		relationship, highlightStrings, symbol
	) {
		const msg = {
			channel: channelFileName(chobj),
			channelName: channelFullName(chobj),
			highlight: highlightStrings,
			id: uuid.v4(),
			isAction,
			message,
			relationship,
			server: chobj.server,
			symbol,
			time,
			type: "msg",
			username: from
		};

		// Cache and emit
		cacheChannelEvent(msg.channel, msg);
		if (relationship >= RELATIONSHIP_FRIEND) {
			cacheUserMessage(from, msg);
		}
	};

	var emitChannelUserList = function(channelUri) {
		emitEventToChannel(channelUri, "channelUserList", {
			channel: channelUri,
			list: channelUserLists[channelUri],
			type: "userlist"
		});
	};

	var handleMessage = function(client, from, to, message, isAction){

		// Channel object
		const chobj = channelObject(client, to);

		// Time
		const time = new Date();

		// Symbol
		const symbol = getUserCurrentSymbol(client, to, from);

		// Log output
		var line = "<" + symbol + from + "> " + message;

		if (isAction) {
			line = "* " + symbol + from + " " + message;
		}

		// Log the line!
		logLine(chobj, line);

		// Don't go further if this guy is "not a person"
		if (config.nonPeople.indexOf(from) >= 0) {
			return
		}

		// Is this from a person among our friends? Note down "last seen" time.

		const relationship = util.getRelationship(from);

		if (relationship >= RELATIONSHIP_FRIEND) {
			// Add to specific logs
			logLine(chobj, line, null, from.toLowerCase());
		}

		var highlightStrings = [];

		// Mention? Add to specific logs
		var meRegex = new RegExp("\\b" + client.extConfig.me + "\\b", "i")
		if (meRegex.test(message)) {
			highlightStrings.push(client.extConfig.me);
			logLine(chobj, line, null, "mentions");
		}
		for (var i = 0; i < config.nicknames.length; i++) {
			var nickRegex = new RegExp("\\b" + config.nicknames[i] + "\\b", "i")
			if (nickRegex.test(message)) {
				highlightStrings.push(config.nicknames[i]);
				logLine(chobj, line, null, "nickmentions");
			}
		}

		updateLastSeen(chobj, from, time, message, isAction, relationship);
		emitMessage(
			chobj, from, time, message, isAction, relationship,
			highlightStrings, symbol
		);
	};

	var handleEvent = function(client, channel, name, line, data, time) {
		const chobj = channelObject(client, channel);
		logLine(chobj, line);

		const c = channelFileName(chobj);

		// Channel user lists
		if (
			USER_MODIFYING_EVENT_TYPES.indexOf(name) >= 0 &&
			data &&
			data.username
		) {
			channelUserLists[c] = client.chans[channel].users;
			emitChannelUserList(c);
		}

		const metadata = {
			channel: c,
			channelName: channelFullName(chobj),
			id: uuid.v4(),
			relationship: data && data.username && util.getRelationship(data.username),
			server: chobj.server,
			time: time || new Date(),
			type: name
		};

		const event = lodash.assign(metadata, data);

		if (BUNCHABLE_EVENT_TYPES.indexOf(name) >= 0) {
			cacheBunchableChannelEvent(c, event);
		} else {
			cacheChannelEvent(c, event);
		}
	};

	var setChannelUserList = function(client, channel, userList) {
		const chobj = channelObject(client, channel);
		const c = channelFileName(chobj);

		if (c) {
			channelUserLists[c] = userList || {};
		}
	};

	var getUserCurrentSymbol = function(client, channel, userName) {
		const chobj = channelObject(client, channel);
		const c = channelFileName(chobj);

		if (c && channelUserLists[c]) {
			return channelUserLists[c][userName] || "";
		}

		return "";
	};

	for(i = 0; i < clients.length; i++){
		var client = clients[i]

		// TEMP
		client.send("CAP", "REQ", "twitch.tv/membership");
		// END TEMP

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

		client.addListener("message", function (from, to, message) {
			handleMessage(client, from, to, message, false)
		});

		client.addListener("action", function (from, to, message) {
			handleMessage(client, from, to, message, true)
		});

		client.addListener("error", function(message) {
			console.log("IRC Error:", message);
		});

		client.addListener("names", (channel, nicks) => {
			setChannelUserList(client, channel, nicks);
		});

		client.addListener("join", (channel, username, message) => {
			const line = "** " + username + " joined";
			handleEvent(client, channel, "join", line, { username, rawData: message });
		});

		client.addListener("part", (channel, username, reason, message) => {
			const line = "** " + username + " left" +
				(reason ? " (" + reason + ")" : "");
			handleEvent(client, channel, "part", line, { username, reason, rawData: message });
		});

		client.addListener("quit", (username, reason, channels, message) => {
			const line = "** " + username + " quit" +
				(reason ? " (" + reason + ")" : "");
			console.log(line);
			// TODO: Network wide events, look at all current channel recipients that are on this network
			/* handleEvent(
				client, null, "quit", line,
				{ username, reason, channels, message }
			); */
		});

		client.addListener("kick", (channel, username, by, reason, message) => {
			const line = "** " + username + " was kicked by " + by +
				(reason ? " (" + reason + ")" : "");
			handleEvent(
				client, channel, "kick", line,
				{ username, by, reason, rawData: message }
			);
		});

		client.addListener("+mode", (channel, username, mode, argument, message) => {
			const line = "** " + username + " sets mode: +" + mode +
				(argument ? " " + argument : "");
			handleEvent(
				client, channel, "+mode", line,
				{ username, mode, argument, rawData: message }
			);
		});

		client.addListener("-mode", (channel, username, mode, argument, message) => {
			const line = "** " + username + " sets mode: -" + mode +
				(argument ? " " + argument : "");
			handleEvent(
				client, channel, "-mode", line,
				{ username, mode, argument, rawData: message }
			);
		});

		client.addListener("kill", (username, reason, channels, message) => {
			const line = "** " + username + " was killed" +
				(reason ? " (" + reason + ")" : "");
			console.log(line);
			// TODO
		});
	}

	// Send out updates to last seen
	var broadcastLastSeenUpdates = function(){
		if (cachedLastSeens) {
			const values = Object.values(cachedLastSeens);
			if (values && values.length) {
				io.emit("lastSeen", values);
				cachedLastSeens = {};
			}
		}
	};

	// Am I going to regret this?
	setInterval(broadcastLastSeenUpdates, LAST_SEEN_UPDATE_RATE);

	// Send message

	var sendOutgoingMessage = function(channelUrl, message, isAction = false) {
		const serverName  = util.channelServerNameFromUrl(channelUrl);
		const channelName = util.channelNameFromUrl(channelUrl);
		if (serverName && channelName) {
			const client = findClientByServerName(serverName);
			if (client) {

				const meRegex = /^\/me\s+/;
				if (!isAction && meRegex.test(message)) {
					isAction = true;
					message = message.replace(meRegex, "");
				}

				if (isAction) {
					client.action(channelName, message);
				} else {
					client.say(channelName, message);
				}
				// Handle our own message as if it's incoming
				handleMessage(
					client, client.extConfig.username,
					channelName, message, isAction
				);
				return true;
			}
		}

		return false;
	};

	// Recipients of messages

	var addRecipient = function(list, targetName, socket) {
		if (!list[targetName]) {
			list[targetName] = [];
		}
		if (list[targetName].indexOf(socket) < 0) {
			list[targetName].push(socket);
		}
	};

	var removeRecipient = function(list, targetName, socket) {
		if (list[targetName]){
			lodash.remove(list[targetName], (r) => r === socket);
		}
	};

	var addChannelRecipient = function(channelUrl, socket) {
		addRecipient(channelRecipients, channelUrl, socket);
	};

	var removeChannelRecipient = function(channelUrl, socket) {
		removeRecipient(channelRecipients, channelUrl, socket);
	};

	var addUserRecipient = function(username, socket) {
		addRecipient(userRecipients, username, socket);
	};

	var removeUserRecipient = function(username, socket) {
		removeRecipient(userRecipients, username, socket);
	};

	// Deferred socket.io availability support
	var setIo = function(_io){
		io = _io
	}

	var getIrcConfig = function() {
		var ircConfig = lodash.cloneDeep(config.irc);
		return ircConfig.map((item) => {
			if (item) {
				delete item.password;
			}
			return item;
		})
	};

	// Exported objects and methods
	return {
		client,
		lastSeenChannels: function(){ return lastSeenChannels },
		lastSeenUsers: function(){ return lastSeenUsers },
		getIrcConfig,
		setIo,
		calibrateMultiServerChannels,
		getChannelCache: function(channelUri){ return channelCaches[channelUri]; },
		getUserCache: function(username){ return userCaches[username]; },
		getChannelUserList: function(channelUri) { return channelUserLists[channelUri]; },
		sendOutgoingMessage,
		addChannelRecipient,
		removeChannelRecipient,
		addUserRecipient,
		removeUserRecipient
	};
}
