const _ = require("lodash");
const async = require("async");

const stringUtils = require("../util/strings");

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
		main.appConfig().loadAppConfig((err, appConfig) => {

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
				let shown = "display: block";
				let hidden = "display: none";
				let networkType = reqBody && reqBody.networkType;

				let ircTypeDisplay = networkType !== "twitch" ? shown : hidden;
				let twitchTypeDisplay = networkType === "twitch" ? shown : hidden;

				let ircTypeClass = "irc" + (networkType !== "twitch" ? " selected" : "");
				let twitchTypeClass = "twitch" + (networkType === "twitch" ? " selected" : "");

				// Make sure web port is prefilled
				appConfig.webPort = main.appConfig().configValue("webPort");

				res.render("welcome", {
					appConfig, enableScripts: false, error, reqBody,
					ircTypeDisplay, twitchTypeDisplay,
					ircTypeClass, twitchTypeClass
				});
			}
		});
	};

	const get = function(req, res) {
		showWelcomePage(res);
	};

	const post = function(req, res) {
		var error = null;

		const config = main.appConfig().currentAppConfig();
		if (config && config.webPassword) {
			// It's already set up; no longer showing welcome page
			res.redirect("/");
			res.end();
			return;
		}

		const onError = function() {
			// Show form again, pre-filled
			showWelcomePage(res, error, reqBody);
		};

		const reqBody = req.body;
		const restricted = config.restrictedMode;

		var ircData;

		if (
			!reqBody.webPassword ||
			!reqBody.networkType ||
			!reqBody.ircChannels
		) {
			error = "You have not filled in all required fields.";
			onError();
			return;
		}

		// Preparing data

		const channels = _.uniq(splitByLineBreak(reqBody.ircChannels));

		if (reqBody.networkType === "irc") {
			if (
				!reqBody.ircName ||
				!reqBody.ircHostname ||
				!reqBody.ircPort ||
				!reqBody.ircNickname
			) {
				error = "You have not filled in all required fields.";
				onError();
				return;
			}
			else {
				ircData = {
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
						channels
					}
				};
			}
		}

		else if (reqBody.networkType === "twitch") {
			if (
				!reqBody.twitchUsername ||
				!reqBody.twitchPassword
			) {
				error = "You have not filled in all required fields.";
				onError();
				return;
			}

			else {
				ircData = {
					name: "twitch",
					data: {
						hostname: "irc.chat.twitch.tv",
						port: "6697",
						nickname: reqBody.twitchUsername,
						username: reqBody.twitchUsername,
						password: reqBody.twitchPassword,
						secure: true,
						channels
					}
				};
			}
		}

		else {
			error = "Invalid network type.";
			onError();
			return;
		}

		const friends = _.uniq(splitByLineBreak(reqBody.friends));

		const friendActions = friends.map((friendName) => {
			return (callback) => {
				let name = stringUtils.formatUriName(friendName);

				if (name) {
					return main.friends().addToFriends(
						0, name, false, callback
					);
				}

				else {
					callback();
				}
			};
		});

		const strongEncryption = restricted
			? config.strongEncryptionMode // no override allowed
			: !!reqBody.strongEncryptionMode;

		if (strongEncryption) {
			main.ircPasswords().onDecryptionKey(reqBody.webPassword);
		}

		// Submitting

		main.appConfig().storeConfigValue(
			"webPassword", reqBody.webPassword,
			function(err, hashedPassword) {

				if (err) {
					// Show error
					showWelcomePage(res, err, reqBody);
					res.end();
					return;
				}

				let encryptKey = strongEncryption
					? reqBody.webPassword
					: hashedPassword;

				main.ircConfig().setEncryptionKey(encryptKey);

				async.parallel([
					(callback) => {
						if (reqBody.timeZone) {
							return main.appConfig().storeConfigValue(
								"timeZone", reqBody.timeZone, callback
							);
						}
						callback();
					},
					(callback) => {
						if (!restricted && reqBody.webPort) {
							return main.appConfig().storeConfigValue(
								"webPort", reqBody.webPort, callback
							);
						}
						callback();
					},
					(callback) => {
						if (strongEncryption) {
							return main.appConfig().storeConfigValue(
								"strongIrcPasswordEncryption", true, callback
							);
						}
						callback();
					},
					(callback) => {
						main.ircConfig().addIrcServerFromDetails(ircData, callback);
					},
					...friendActions
				], (err) => {
					if (err) {
						// Show error
						showWelcomePage(res, err, reqBody);
						res.end();
					}
					else {
						// Reload data after success
						async.parallel([
							main.appConfig().loadAppConfig,
							main.friends().loadFriendsList
						], () => {
							// Ready to go!!
							main.ircControl().loadAndConnectUnconnectedIrcs();
							res.redirect("/login");
							res.end();
						});
					}
				});
			}
		);
	};

	return { get, post };
};
