// IRC WATCHER
// IRC module

// Prerequisites
var irc    = require("irc"),
	fs     = require("fs"),
	mkdirp = require("mkdirp"),
	path   = require("path")

module.exports = function(config, util, log){

	var io = {} // To be filled in later

	// Load last seen info
	var lastSeenFileName = path.join(__dirname, "lastseen.json")

	if(!fs.exists(lastSeenFileName)){
		fs.openSync(lastSeenFileName, "w")
	}

	var lastSeenJson = fs.readFileSync(lastSeenFileName)
	var lastSeen = {}

	try {
		lastSeen = JSON.parse(lastSeenJson)
	} catch(e){}
	if(!lastSeen){
		lastSeen = {}
	}

	var clients = [], i, multiServerChannels = []

	// Let's go!
	for(i = 0; i < config.irc.length; i++){
		var cf = config.irc[i]
		console.log("Connecting to " + cf.server + " as " + cf.username)

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
		)
		c.extConfig = cf
		clients.push(c)
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
	}

	var updateLastSeen = function(chobj, username, date, message, isAction, isBestFriend){
		lastSeen[username] = date
		if("emit" in io){
			io.emit("msg", {
				channel: channelFullName(chobj),
				channelUrl: channelFileName(chobj),
				username: username,
				date: date,
				message: message,
				isAction: isAction,
				isBestFriend: isBestFriend
			})
		} else {
			console.warn("Tried to emit msg event, but io object was not available")
		}
		fs.writeFile(
			lastSeenFileName,
			JSON.stringify(lastSeen),
			{ encoding: config.encoding },
			function(err){
				if(err){
					throw err
				}
				// It was written!
			}
		)
	}

	var handleMessage = function(client, from, to, message, isAction){

		// Channel object
		var chobj = channelObject(client, to)

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
		var allFriends = config.bestFriends.concat(config.friends)
		if(allFriends.indexOf(from.toLowerCase()) >= 0){
			var isBestFriend = config.bestFriends.indexOf(from.toLowerCase()) >= 0;
			updateLastSeen(chobj, from, new Date(), message, isAction, isBestFriend)

			// Add to specific logs
			logLine(chobj, line, null, from.toLowerCase())
		}

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

	// Exported objects and methods
	return {
		client: client,
		lastSeen: function(){ return lastSeen },
		setIo: setIo,
		calibrateMultiServerChannels: calibrateMultiServerChannels
	}
}
