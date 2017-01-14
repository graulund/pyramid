// IRC WATCHER
// Routes module

const moment = require("moment-timezone");
const cookie = require("cookie");

const TOKEN_COOKIE_NAME = "token"; // TODO: Don't redefine
const TOKEN_COOKIE_SECONDS = 86400 * 365;

module.exports = function(app, config, util, log, irc){

	// Helper methods
	const h = require("./viewhelpers")(log);

	// Access control ---------------------------------------------------------

	const getUsedToken = function(req) {
		var cookies = cookie.parse(req.headers.cookie || "");
		if (cookies && cookies[TOKEN_COOKIE_NAME]) {
			return cookies[TOKEN_COOKIE_NAME];
		}

		return null;
	};

	const isLoggedIn = function(req) {
		const token = getUsedToken(req);
		if (token) {
			return util.isAnAcceptedToken(token);
		}

		return false;
	};

	const denyAccessWithoutToken = function(req, res) {

		const loggedIn = isLoggedIn(req);

		if (loggedIn) {
			return loggedIn;
		}

		// Redirect to login page
		res.redirect("/login");
		res.end();
		return false;
	};

	const setTokenCookie = function(res, value, params) {
		return res.set(
			"Set-Cookie",
			cookie.serialize(
				TOKEN_COOKIE_NAME,
				value,
				params
			)
		);
	}

	// Home page --------------------------------------------------------------

	app.get("/", function(req, res) {
		const accepted = denyAccessWithoutToken(req, res);
		if (accepted) {
			res.render("index", {
				// Variables
				lastSeenChannels: irc.lastSeenChannels(),
				lastSeenUsers: irc.lastSeenUsers(),
				ircConfig: irc.getIrcConfig(),
				friends: config.friends,
				bestFriends: config.bestFriends,
				timezone: config.timeZone,
				token: getUsedToken(req),
				// Includes
				moment: moment,
				h: h
			});
		}
	});

	// Login page -------------------------------------------------------------

	app.get("/login", function(req, res) {
		if (!isLoggedIn(req, res)) {
			res.render("login");
		} else {
			res.redirect("/");
		}
	});

	app.post("/login", function(req, res) {
		if (req.body && req.body.password === config.webPassword) {

			if (req.body.logOutOtherSessions) {
				util.clearAcceptedTokens();
			}

			const token = util.generateAcceptedToken();
			setTokenCookie(
				res,
				token,
				{
					httpOnly: true,
					maxAge: TOKEN_COOKIE_SECONDS
				}
			);
			res.redirect("/");
		}

		res.end("That wasn't correct. Sorry.");
	});

	// Logout page ------------------------------------------------------------

	app.get("/logout", function(req, res) {
		// Set already expired cookie in order to remove the cookie
		setTokenCookie(
			res,
			"k",
			{
				httpOnly: true,
				expires: new Date("1997-01-01 00:00:00")
			}
		);
		res.redirect("/login");
	});

	/*
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
	});

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
	*/
}
