const async = require("async");
const lodash = require("lodash");

const util = require("../util");

module.exports = function(main) {

	const splitByLineBreak = function(text) {
		const out = [];

		if (text && typeof text === "string") {
			text.split("\n").forEach((s) => {
				const trimmed = s.trim();

				if (trimmed) {
					out.push(trimmed);
				}
			});
		}

		return out;
	};

	const showWelcomePage = function (res, error = null, reqBody = {}) {
		main.loadAppConfig((err, appConfig) => {

			if (appConfig && appConfig.webPassword) {
				// It's already set up; no longer showing welcome page
				if (error) {
					// If we have an error to show, show it
					res.end(error);
				}
				else {
					res.redirect("/");
					res.end();
				}
			}
			else {
				res.render("welcome", {
					appConfig, enableScripts: false, error, reqBody
				});
			}
		});
	};

	const get = function(req, res) {
		showWelcomePage(res);
	};

	const post = function(req, res) {
		var error = null;

		const config = main.currentAppConfig();
		if (config && config.webPassword) {
			// It's already set up; no longer showing welcome page
			res.redirect("/");
			res.end();
			return;
		}

		const reqBody = req.body;

		if (
			!reqBody.webPassword ||
			!reqBody.ircName ||
			!reqBody.ircHostname ||
			!reqBody.ircPort ||
			!reqBody.ircNickname ||
			!reqBody.ircChannels
		) {
			error = "You have not filled in all required fields.";
		}

		if (!error) {

			// Preparing data

			const ircData = {
				name: reqBody.ircName,
				data: {
					hostname: reqBody.ircHostname,
					port: reqBody.ircPort,
					nickname: reqBody.ircNickname,
					username: reqBody.ircUsername,
					password: reqBody.ircPassword,
					secure: !!reqBody.ircSecure,
					selfSigned: !!reqBody.ircSelfSigned,
					certExpired: !!reqBody.ircCertExpired,
					channels: lodash.uniq(splitByLineBreak(reqBody.ircChannels))
				}
			};

			const friends = lodash.uniq(splitByLineBreak(reqBody.friends));

			const friendActions = friends.map((friendName) => {
				return (callback) => main.addToFriends(
					0, util.formatUriName(friendName), false, callback
				);
			});

			// Submitting

			async.parallel([
				(callback) => {
					if (reqBody.timeZone) {
						return main.storeConfigValue(
							"timeZone", reqBody.timeZone, callback
						);
					}
					callback();
				},
				(callback) => {
					if (reqBody.webPort) {
						return main.storeConfigValue(
							"webPort", reqBody.webPort, callback
						);
					}
					callback();
				},
				(callback) =>
					main.storeConfigValue(
						"webPassword", reqBody.webPassword, callback
					),
				(callback) => {
					main.addIrcServerFromDetails(ircData, (err) => {
						if (err) {
							callback(err);
						}
						else {
							main.loadAndConnectUnconnectedIrcs(callback);
						}
					});
				},
				...friendActions
			], (err, results) => {
				if (err) {
					// Show error
					showWelcomePage(res, err, reqBody);
					res.end();
				}
				else {
					// Reload data after success
					async.parallel([
						main.loadAppConfig,
						main.loadFriendsList
					], () => {
						// Ready to go!!
						res.redirect("/login");
						res.end();
					});
				}
			})
		}
		else {
			// Show form again, pre-filled
			showWelcomePage(res, error, reqBody);
		}
	};

	return { get, post };
};
