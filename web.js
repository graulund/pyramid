// IRC WATCHER
// Web module

var path = require("path")

module.exports = function(config, util, log, irc){

	// Prerequisites
	var express  = require("express")
	//var favicon  = require("serve-favicon")
	var partials = require("express-partials")


	// The web app
	var app = express()
	app.set("views", path.join(__dirname, "views"))
	app.set("view engine", "ejs")
	//app.use(favicon());
	app.use(express.static(path.join(__dirname, "public")));
	app.use(partials());

	// Routes
	require("./routes")(app, config, util, log, irc)

	// Fallback: 404 error
	app.use(function(req, res, next) {
		var err = new Error("Not Found");
		err.status = 404;
		next(err);
	});

	// --------------------------------------------------------
	// Error handlers

	// Development error handler
	// (Will print stacktrace)
	if (app.get("env") === "development") {
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render("error", {
				message: err.message,
				error: err
			});
		});
	}

	// Production error handler
	// (No stacktraces leaked to user)
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render("error", {
			message: err.message,
			error: {}
		});
	});

	// --------------------------------------------------------
	// Server

	app.server = app.listen(config.webPort, function() {
		console.log("Listening on port %d", app.server.address().port);
	});
	var io = require("socket.io")(app.server);

	// Update IRC object with IO support
	irc.setIo(io)


	return {
		app: app
	}
}