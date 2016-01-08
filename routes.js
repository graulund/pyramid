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
			lastSeen: irc.lastSeen(),
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
				res.render('user.ejs', {
					username: req.params.username,
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
}
