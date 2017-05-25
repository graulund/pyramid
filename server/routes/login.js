const constants = require("../constants");
const passwordUtils = require("../util/passwords");
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
		let passwordHash = main.appConfig().currentAppConfig().webPassword;
		if (
			req.body &&
			passwordUtils.verifyPassword(req.body.password, passwordHash)
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

		res.end(
			"That wasn't correct. Sorry.\n\n" +
			"If you've recently updated Pyramid, be aware that passwords are stored differently now, and you are required to run the scripts/updatePasswords.js script from a command line before you can use Pyramid again. Sorry about that."
		);
	}

	return { get, post };
};
