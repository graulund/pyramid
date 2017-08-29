// PYRAMID
// Routes module

module.exports = function(app, main) {

	// Login page

	const login = require("./routes/login")(main);
	app.get("/login", login.get);
	app.post("/login", login.post);

	// Logout page

	app.get("/logout", require("./routes/logout"));

	// Welcome page

	const welcome = require("./routes/welcome")(main);
	app.get("/welcome", welcome.get);
	app.post("/welcome", welcome.post);

	// Pyramid meta page

	app.get("/.pyramid", function(req, res) {
		res.set("Content-Type", "text/plain");
		res.end("yes");
	});

	// Main page

	app.get("*", require("./routes/home")(main));
};
