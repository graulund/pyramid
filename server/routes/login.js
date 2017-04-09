const constants = require("../constants");
const routeUtils = require("../routeUtils");
const util = require("../util");

module.exports = function(main) {

	function get(req, res) {
		const config = main.currentAppConfig();
		if (!config || !config.webPassword) {
			res.redirect("/welcome");
		}
		else if (!routeUtils.isLoggedIn(req, res)) {
			res.render("login", { appConfig: null, enableScripts: false });
		}
		else {
			routeUtils.redirectBack(req, res);
		}
	}

	function post(req, res) {
		if (req.body && req.body.password === main.currentAppConfig().webPassword) {

			if (req.body.logOutOtherSessions) {
				util.clearAcceptedTokens();
			}

			const token = util.generateAcceptedToken();
			routeUtils.setTokenCookie(
				res,
				token,
				{
					httpOnly: true,
					maxAge: constants.TOKEN_COOKIE_SECONDS
				}
			);

			routeUtils.redirectBack(req, res);
		}

		res.end("That wasn't correct. Sorry.");
	}

	return { get, post };
};
