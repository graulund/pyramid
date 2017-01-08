// IRC WATCHER
// IRC module

// Prerequisites
var irc    = require("irc"),
	fs     = require("fs"),
	mkdirp = require("mkdirp"),
	path   = require("path"),
	lodash = require("lodash")

// Constants
const RELATIONSHIP_NONE = 0;
const RELATIONSHIP_FRIEND = 1;
const RELATIONSHIP_BEST_FRIEND = 2;

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

	// Set up IRC

	var clients = [], i, multiServerChannels = [];

	for(i = 0; i < config.irc.length; i++){
		var cf = config.irc[i];
		console.log("Connecting to " + cf.server + " as " + cf.username);

		var c = new irc.Client(
			cf.server, cf.username,
			{
				channels:   cf.channels,
				port:       cf.port || 6667,
				userName:   cf.username,
				realName:   cf.realname || cf.username,
				password:   cf.password || "",
				debug:      config.debug,
				showErrors: config.debug
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
			console.log(line)
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

		if (relationship >= RELATIONSHIP_FRIEND) {
			lastSeenUsers[username] = {
				channel,
				channelName,
				time
			};
			writeLastSeen(lastSeenUsersFileName, lastSeenUsers);
		}
	};

	var emitMessage = function(chobj, from, time, message, isAction, relationship) {
		if("emit" in io){
			io.emit("msg", {
				channel: channelFileName(chobj),
				channelName: channelFullName(chobj),
				time,
				isAction,
				message,
				relationship,
				server: chobj.server,
				username: from
			})
		} else {
			console.warn("Tried to emit msg event, but io object was not available")
		}
	};

	var handleMessage = function(client, from, to, message, isAction){

		// Channel object
		const chobj = channelObject(client, to)

		// Time
		const time = new Date();

		// Log output
		var line = "<" + from + "> " + message
		if(isAction){
			line = "* " + from + " " + message
		}

		// Log the line!
		logLine(chobj, line)

		// Don't go further if this guy is "not a person"
		if(config.nonPeople.indexOf(from) >= 0){
			return
		}

		// Is this from a person among our friends? Note down "last seen" time.
		var relationship = RELATIONSHIP_NONE;
		var allFriends = config.bestFriends.concat(config.friends)
		if(allFriends.indexOf(from.toLowerCase()) >= 0){
			var isBestFriend = config.bestFriends.indexOf(from.toLowerCase()) >= 0;
			relationship = isBestFriend
				? RELATIONSHIP_BEST_FRIEND
				: RELATIONSHIP_FRIEND;
			// Add to specific logs
			logLine(chobj, line, null, from.toLowerCase());
		}

		updateLastSeen(chobj, from, time, message, isAction, relationship);
		emitMessage(chobj, from, time, message, isAction, relationship);

		// Mention?
		var meRegex = new RegExp("\\b" + client.extConfig.me + "\\b", "i")
		if(meRegex.test(message)){
			// Add to specific logs
			logLine(chobj, line, null, "mentions")
		}
		for(var i = 0; i < config.nicknames.length; i++){
			var nickRegex = new RegExp("\\b" + config.nicknames[i] + "\\b", "i")
			if(nickRegex.test(message)){
				// Add to specific logs
				logLine(chobj, line, null, "nickmentions")
			}
		}
	}

	for(i = 0; i < clients.length; i++){
		var client = clients[i]
		client.addListener("message", function (from, to, message){
			handleMessage(this, from, to, message, false)
		})

		client.addListener("action", function (from, to, message){
			handleMessage(this, from, to, message, true)
		})

		client.addListener("error", function(message) {
			console.log("IRC Error: ", message);
		})
	}

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
		calibrateMultiServerChannels
	};
}
