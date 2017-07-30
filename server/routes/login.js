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

			main.ircPasswords().onDecryptionKey(req.body.password);

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
			return;
		}

		// If you don't get the password right, punish the user with waiting time
		// TODO: Increase this time with multiple bad attempts by the same person

		setTimeout(() => {
			res.render("unauthorized", { appConfig: null, enableScripts: false });
		}, 3000);
	}

	return { get, post };
};
