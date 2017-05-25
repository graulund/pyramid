const cookie = require("cookie");

const constants = require("../constants");
const tokenUtils = require("./tokens");

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
		return tokenUtils.isAnAcceptedToken(token);
	}

	return false;
};

const denyAccessWithoutToken = function(req, res, main) {

	const loggedIn = isLoggedIn(req);

	if (loggedIn) {
		return loggedIn;
	}

	// If we have no password, redirect to welcome page
	const config = main.appConfig().currentAppConfig();
	if (!config || !config.webPassword) {
		res.redirect("/welcome");
	}

	// Otherwise, redirect to login page
	else {
		res.redirect("/login?redirect=" + encodeURIComponent(req.url));
	}

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
	}
	else {
		res.redirect("/");
	}
};

module.exports = {
	denyAccessWithoutToken,
	getUsedToken,
	isLoggedIn,
	redirectBack,
	setTokenCookie
};
