// PYRAMID
// Routes module

const async = require("async");
const moment = require("moment-timezone");
const cookie = require("cookie");
const lodash = require("lodash");

const constants = require("./constants");
const configDefaults = require("./defaults");
const util = require("./util");
const h = require("./viewhelpers");

module.exports = function(app, main) {

	// Helper methods

	// Access control ---------------------------------------------------------

	const getUsedToken = function(req) {
		var cookies = cookie.parse(req.headers.cookie || "");
		if (cookies && cookies[constants.TOKEN_COOKIE_NAME]) {
			return cookies[constants.TOKEN_COOKIE_NAME];
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
				constants.TOKEN_COOKIE_NAME,
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
			res.render("login", { appConfig: null });
		} else {
			redirectBack(req, res);
		}
	});

	app.post("/login", function(req, res) {
		if (req.body && req.body.password === main.currentAppConfig().webPassword) {

			if (req.body.logOutOtherSessions) {
				util.clearAcceptedTokens();
			}

			const token = util.generateAcceptedToken();
			setTokenCookie(
				res,
				token,
				{
					httpOnly: true,
					maxAge: constants.TOKEN_COOKIE_SECONDS
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
			async.parallel({
				ircConfig: main.loadIrcConfig,
				appConfig: main.loadAppConfig
			}, function(err, results) {
				if (err) {
					// TODO: handle lol
					throw err;
				}

				res.render("index", {
					// Variables
					appConfig: lodash.assign({}, configDefaults, results.appConfig),
					friendsList: main.currentFriendsList(),
					ircConfig: main.safeIrcConfigDict(results.ircConfig),
					ircConnectionState: main.currentIrcConnectionState(),
					lastSeenChannels: main.lastSeenChannels(),
					lastSeenUsers: main.lastSeenUsers(),
					nicknames: main.nicknamesDict(),
					token: getUsedToken(req),
					viewState: main.currentViewState(),
					// Includes
					constants,
					lodash
				});
			});

		}
	});
}
