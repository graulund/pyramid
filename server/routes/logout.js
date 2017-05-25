const routeUtils = require("../util/routing");

module.exports = function(req, res) {
	// Set already expired cookie in order to remove the cookie
	routeUtils.setTokenCookie(
		res,
		"k",
		{
			httpOnly: true,
			expires: new Date("1997-01-01 00:00:00")
		}
	);
	res.redirect("/login");
};
