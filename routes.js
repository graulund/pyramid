// IRC WATCHER
// Routes module

var moment = require("moment-timezone")

module.exports = function(app, config, util, log, irc){

	// Helper methods
	var h = require("./viewhelpers")(log)

	// Home page --------------------------------------------------------------

	app.get("/", function(req, res) {
		res.render("index", {
			// Variables
			lastSeenChannels: irc.lastSeenChannels(),
			lastSeenUsers: irc.lastSeenUsers(),
			ircConfig: irc.getIrcConfig(),
			friends: config.friends,
			bestFriends: config.bestFriends,
			timezone: config.timeZone,
			// Includes
			moment: moment,
			h: h
		})
	})

	// All page ---------------------------------------------------------------

	app.get("/all", function(req, res) {
		res.render("all", {
			// Variables
			lines: [],
			timezone: config.timeZone,
			// Includes
			moment: moment,
			h: h
		})
	})

	// User page --------------------------------------------------------------

	app.get("/user/:username", function(req, res, next) {
		if(req.params.username){

			log.getLastLinesFromUser(req.params.username, {},
					function(err, data, lineNum){

				if(err){
					next(err)
					return
				}

				var lines = h.convertLogFileToLineObjects(data)
				res.render("log.ejs", {
					heading: req.params.username,
					lines: lines,
					lineNum: lineNum,
					timezone: config.timeZone,
					moment: moment,
					h: h
					// Always pass in h :D
				})
			})

		}
	})

	// Stats page -------------------------------------------------------------

	app.get("/stats/:channel", function(req, res, next){

		log.statsFromLastDays(req.params.channel, 10, function(err, dayValues){

			if(err){
				next(err)
				return
			}

			res.render("stats.ejs", {
				dayValues: dayValues,
				channel: req.params.channel,
				moment: moment,
				h: h
			})
		})
	})

	// Logs page -------------------------------------------------------------

	app.get("/logs/:server/:channel/:date", function(req, res, next){

		if(req.params.server && req.params.channel && req.params.date){
			var date = moment(req.params.date);

			if (!date.isValid()) {
				next();
				return;
			}

			log.getChatroomLinesForDay(req.params.server, req.params.channel, date,
					function(err, data){

				if(err){
					next(err)
					return
				}

				var lines = h.convertLogFileToLineObjects(data, util.ymd(date))
				res.render("log.ejs", {
					heading: req.params.channel,
					lines: lines,
					timezone: config.timeZone,
					moment: moment,
					h: h
					// Always pass in h :D
				})
			})

		} else {
			next();
		}
	})
}
