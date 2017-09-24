// PYRAMID
// Web module

const path = require("path");

const bodyParser = require("body-parser");
const express = require("express");
//const favicon = require("serve-favicon");
const partials = require("express-partials");

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
			// eslint-disable-next-line no-unused-vars
			app.use(function(err, req, res, next) {
				res.status(err.status || 500);
				res.render("error", {
					appConfig: null,
					enableScripts: false,
					error: err,
					message: err.message
				});
			});
		}

		// Production error handler
		// (No stacktraces leaked to user)

		// eslint-disable-next-line no-unused-vars
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render("error", {
				appConfig: null,
				enableScripts: false,
				error: {},
				message: err.message
			});
		});

		// --------------------------------------------------------
		// Server
		// (HTTPS if specified)

		let server = null;
		let config = main.appConfig().configValue;

		let certPath = config("httpsCertPath");
		let keyPath = config("httpsKeyPath");
		let webHostname = config("webHostname");
		let webPort = config("webPort");

		if (keyPath && certPath) {
			// Secure HTTPS server
			server = require("./https")({
				app,
				certPath,
				keyPath,
				server,
				webHostname,
				webPort
			});
		} else {
			// Plain HTTP server
			server = app.listen(webPort, webHostname, function() {
				let a = server.address();
				console.log(`Listening on ${a.address}:${a.port}`);
			});
		}

		app.server = server;
		io.setServer(app.server);

		return app;
	};

	const output = {
		go
	};

	main.setWeb(output);
	return output;
};
