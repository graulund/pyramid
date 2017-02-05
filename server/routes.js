// PYRAMID
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
		res.redirect("/login?redirect=" + encodeURIComponent(req.url));
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
	};

	const redirectBack = function(req, res) {
		if (
			// Internal links only
			req.query &&
			req.query.redirect &&
			req.query.redirect[0] === "/"
		) {
			res.redirect(req.query.redirect);
		} else {
			res.redirect("/");
		}
	};

	// Login page -------------------------------------------------------------

	app.get("/login", function(req, res) {
		if (!isLoggedIn(req, res)) {
			res.render("login");
		} else {
			redirectBack(req, res);
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

			redirectBack(req, res);
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

	// Main page --------------------------------------------------------------

	app.get("*", function(req, res) {
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
				moment,
				h
			});
		}
	});
}
