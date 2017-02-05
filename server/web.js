// PYRAMID
// Web module

const path = require("path");
const bodyParser = require("body-parser");

const config = require("../config");
const constants = require("./constants");
const util = require("./util");

module.exports = function(log, irc, io){

	// Prerequisites
	const express  = require("express");
	//const favicon  = require("serve-favicon");
	const partials = require("express-partials");
	const fs       = require("fs");

	// The web app
	var app = express();
	app.set("views", path.join(__dirname, "..", "views"));
	app.set("view engine", "ejs");
	//app.use(favicon());
	app.use(bodyParser.urlencoded({ extended: "qs" }));
	app.use(express.static(path.join(__dirname, "..", "public")));
	app.use(partials());

	// Routes
	require("./routes")(app, config, util, log, irc);

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
	// (HTTPS if specified)

	var server;

	if(
		typeof config.sslKeyPath == "string" && config.sslKeyPath != "" &&
		typeof config.sslCertPath == "string" && config.sslCertPath != ""
	){
		// Secure HTTPS server
		var https = require("https")
		server = https.createServer({
			key: fs.readFileSync(path.join(__dirname, config.sslKeyPath)),
			cert: fs.readFileSync(path.join(__dirname, config.sslCertPath))
		}, app).listen(config.webPort, undefined, undefined, function(){
			console.log("Listening securely on port %d", server.address().port);
		});
	} else {
		// Plain HTTP server
		server = app.listen(config.webPort, function() {
			console.log("Listening on port %d", server.address().port);
		});
	}

	app.server = server;
	io.setServer(app.server);

	return {
		app: app
	}
}
