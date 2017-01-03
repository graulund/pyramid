// IRC WATCHER
// Logging module

var moment = require("moment-timezone"),
	fs     = require("fs"),
	mkdirp = require("mkdirp"),
	path   = require("path"),
	lazy   = require("lazy"),
	async  = require("async")

module.exports = function(config, util){

	var getLastLinesFromUser = function(username, options, done){

		var limit = options.limit

		// Normal limit
		if(typeof limit != "number"){
			limit = 200
		}

		// Sanitizing input
		username = username.replace(/[^a-zA-Z0-9_-]+/, "")

		// Log dir
		var logDir = path.join(__dirname, "public", "data", "logs", "_global", util.ym(options.d))

		fs.readFile(path.join(logDir, username.toLowerCase() + ".txt"), function(err, data){

			if(err){
				done(err)
				return
			}

			data = data.toString(config.encoding)

			var lines = data.split("\n")

			if(lines.length <= limit){
				done(null, data, lines.length-1)
			} else {
				done(null, lines.slice(-1*limit).join("\n"), lines.length-1)
			}
		})

	}

	var getChatroomLinesForDay = function(server, channel, date, done){

		// Sanitizing input
		server = server.replace(/[^a-zA-Z0-9_-]+/, "")
		channel = channel.replace(/[^a-zA-Z0-9_-]+/, "")

		// Log dir
		var logDir = path.join(
			__dirname, "public", "data", "logs",
			server, channel, util.ym(date)
		)

		fs.readFile(path.join(logDir, util.ymd(date) + ".txt"), function(err, data){

			if(err){
				done(err)
				return
			}

			data = data.toString(config.encoding)
			done(null, data)
		})

	}

	var parseLogLine = function(line, date){
		// Convert item to obj instead of str
		var m, obj = {
			type: "msg",
			time: null,
			from: null,
			to: null,
			message: line,
			isAction: false
		}

		// Extract channel identifier (if present)
		if(m = obj.message.match(/^\s*\[([^0-9:])([^\]]*)\]\s*/)){
			obj.to = m[1] + m[2]
			// Remove channel from content string
			obj.message = obj.message.substr(m[0].length)
		}

		// Extract time (if date not present)
		if(m = obj.message.match(/^\s*\[([0-9:]+)\]\s*/)){
			// Extract date from argument, if given
			var d = typeof date == "string" ? date + " " : ""
			// Add time as property
			obj.time = d + m[1]
			// Remove time from content string
			obj.message = obj.message.substr(m[0].length)
		}

		// Extract time (if date present)
		if(m = obj.message.match(/^\s*\[([0-9-]+) ([0-9:]+)\]\s*/)){
			// Add time as property
			obj.time = m[1] + " " + m[2]
			// Remove time from content string
			obj.message = obj.message.substr(m[0].length)
		}

		// Extract author (non-action)
		if(m = obj.message.match(/^\s*<([^>\s]+)>\s*/)){
			obj.from = m[1]
			obj.message = obj.message.substr(m[0].length)
			obj.isAction = false
		}

		// Extract author (action)
		if(!obj.from && (m = obj.message.match(/^\s*\*\s*([^\s]+)\s+/))){
			obj.from = m[1]
			obj.message = obj.message.substr(m[0].length)
			obj.isAction = true
		}

		return obj
	}

	var statsFromFile = function(channel, month, logFileName, done){

		console.log("Checking out " + logFileName)

		// Gather the file path
		var filePath = path.join(__dirname, "public", "logs", channel, month, logFileName.toLowerCase() + ".txt")

		// Only continue if this file exists
		fs.exists(filePath, function(exists){

			// Return if it doesn't exist
			if(!exists){
				done(null, null)
				return
			}

			// Extract date from log file name if applicable
			var fnDate = /^[0-9-]+$/.test(logFileName) ? logFileName : ""

			// The output
			var userCounts = {}

			// Let's do it!
			new lazy(fs.createReadStream(filePath))
				.lines
				.forEach(
					function(line){
						var l = parseLogLine(line.toString(config.encoding), fnDate)
						if(l.type == "msg"){

							var from = l.from.toLowerCase()
							if(config.nonPeople.indexOf(from) >= 0){
								return
							}

							if(!(from in userCounts)){
								userCounts[from] = 0
							}
							userCounts[from]++
						}
					}
				)
				.on("pipe", function(){
					console.log("Got values for " + logFileName) //DEBUG

					// It ended!
					done(null, userCounts)
				})
		})
	}

	var statsFromFileWithArray = function(args, done){
		statsFromFile(args[0], args[1], args[2], done)
	}

	var statsFromDays = function(channel, firstDay, lastDay, done){

		var first = moment(firstDay)
		var now   = moment(lastDay)

		if(!first.isValid() || !now.isValid()){
			return false
		}

		// Preparing args for the methods
		var dayArgs = []
		while(now > firstDay){
			var ym = util.ym(now), ymd = util.ymd(now)
			dayArgs.push([channel, ym, ymd])
			now.subtract(1, "days")
		}

		// One big maddafackin' async call!
		async.map(dayArgs, statsFromFileWithArray, function(err, results){
			// Turn the results array into a dictionary so we have an idea what's what.
			var resultsDict = {}
			if(typeof results == "object" && results instanceof Array){
				for(var i = 0; i < results.length; i++){
					resultsDict[dayArgs[i][2]] = results[i]
				}
			}
			done(err, resultsDict)
		})
		return true
	}

	var statsFromLastDays = function(channel, dayAmount, done){
		if(typeof dayAmount != "number" || dayAmount <= 0){
			// Default: The last X days.
			dayAmount = 16
		}

		var today = moment()
		var firstDay = moment(today).subtract(dayAmount, "days")

		return statsFromDays(channel, firstDay, today, done)
	}

	return {
		getLastLinesFromUser: getLastLinesFromUser,
		getChatroomLinesForDay: getChatroomLinesForDay,
		parseLogLine: parseLogLine,
		statsFromFile: statsFromFile,
		statsFromLastDays: statsFromLastDays
	}
}
