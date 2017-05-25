const constants = require("../constants");
const routeUtils = require("../util/routing");
const tokenUtils = require("../util/tokens");

module.exports = function(main) {

	function get(req, res) {
		const config = main.appConfig().currentAppConfig();
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
		if (
			req.body &&
			req.body.password === main.appConfig().currentAppConfig().webPassword
		) {

			if (req.body.logOutOtherSessions) {
				tokenUtils.clearAcceptedTokens();
			}

			const token = tokenUtils.generateAcceptedToken();
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
