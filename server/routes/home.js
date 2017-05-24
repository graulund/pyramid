const _ = require("lodash");
const async = require("async");

const configDefaults = require("../defaults");
const routeUtils = require("../routeUtils");

module.exports = function(main) {
	return function(req, res) {
		const accepted = routeUtils.denyAccessWithoutToken(req, res, main);
		if (accepted) {
			let appConfig = main.appConfig();
			let friends = main.friends();
			let ircConfig = main.ircConfig();
			let ircConn = main.ircConnectionState;
			let lastSeen = main.lastSeen();
			let nicknames = main.nicknames();
			let unseenHighlights = main.unseenHighlights();
			let userLists = main.userLists();
			let viewState = main.viewState;

			async.parallel({
				appConfig: appConfig.loadAppConfig,
				ircConfig: ircConfig.loadIrcConfig
			}, function(err, results) {
				if (err) {
					res.status(500);
					res.render("error", {
						appConfig: null,
						enableScripts: false,
						error: {},
						message: err.message
					});
					return;
				}

				let currentAppConfig = appConfig.safeAppConfig(
					_.assign({}, configDefaults, results.appConfig)
				);

				res.render("index", {
					// Variables
					appConfig: currentAppConfig,
					friendsList: friends.currentFriendsList(),
					ircConfig: ircConfig.safeIrcConfigDict(results.ircConfig),
					ircConnectionState: ircConn.currentIrcConnectionState(),
					lastSeenChannels: lastSeen.lastSeenChannels(),
					lastSeenUsers: lastSeen.lastSeenUsers(),
					nicknames: nicknames.nicknamesDict(),
					onlineFriends: userLists.currentOnlineFriends(),
					token: routeUtils.getUsedToken(req),
					unseenHighlights: Array.from(unseenHighlights.unseenHighlightIds()),
					viewState: viewState.currentViewState(),
					// Template-related
					enableScripts: true
				});
			});
		}
	};
};
