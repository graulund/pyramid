// IRC WATCHER
// Web module

var path = require("path")

module.exports = function(config, util, log, irc){

	// Prerequisites
	var express  = require("express")
	//var favicon  = require("serve-favicon")
	var partials = require("express-partials")
	var fs       = require("fs")

	// The web app
	var app = express()
	app.set("views", path.join(__dirname, "views"))
	app.set("view engine", "ejs")
	//app.use(favicon());
	app.use(express.static(path.join(__dirname, "public")));
	app.use(partials());

	// Authentication if required
	if(
		typeof config.webUsername == "string" && config.webUsername != "" &&
		typeof config.webPassword == "string" && config.webPassword != ""
	){
		var basicAuth = require("basic-auth-connect");
		app.use(basicAuth(config.webUsername, config.webPassword));
	}

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

	var io = require("socket.io")(app.server);

	// Update IRC object with IO support
	irc.setIo(io)

	return {
		app: app
	}
}