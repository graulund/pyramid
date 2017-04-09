// PYRAMID
// Web module

const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
//const favicon = require("serve-favicon");
const partials = require("express-partials");

const constants = require("./constants");
const log = require("./log");
const util = require("./util");

module.exports = function(main, io) {

	const go = () => {

		// The web app
		var app = express();
		app.set("views", path.join(__dirname, "..", "views"));
		app.set("view engine", "ejs");
		//app.use(favicon());
		app.use(bodyParser.urlencoded({ extended: "qs" }));
		app.use(express.static(
			path.join(__dirname, "..", "public"),
			{
				setHeaders: function(res, reqPath) {
					if (path.extname(reqPath) === ".js") {
						res.setHeader(
							"Content-Type",
							"application/javascript; charset=utf-8"
						);
					}
				}
			}
		));
		app.use(partials());

		// Routes
		require("./routes")(app, main);

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

		var config = main.configValue;

		if (config("sslKeyPath") && config("sslCertPath")){
			// Secure HTTPS server
			var https = require("https")
			server = https.createServer({
				key: fs.readFileSync(path.join(__dirname, "..", config("sslKeyPath"))),
				cert: fs.readFileSync(path.join(__dirname, "..", config("sslCertPath")))
			}, app).listen(config("webPort"), undefined, undefined, function(){
				console.log("Listening securely on port %d", server.address().port);
			});
		} else {
			// Plain HTTP server
			server = app.listen(config("webPort"), function() {
				console.log("Listening on port %d", server.address().port);
			});
		}

		app.server = server;
		io.setServer(app.server);

		return app;
	}

	const output = {
		go
	};

	main.setWeb(output);
	return output;
};
