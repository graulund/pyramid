const _ = require("lodash");
const async = require("async");

const configDefaults = require("../defaults");
const routeUtils = require("../util/routing");

module.exports = function(main) {
	return function(req, res) {
		const accepted = routeUtils.denyAccessWithoutToken(req, res, main);
		if (accepted) {
			let appConfig = main.appConfig();
			let awakeTime = main.awakeTime;
			let friends = main.friends();
			let ircConfig = main.ircConfig();
			let ircConn = main.ircConnectionState;
			let lastSeen = main.lastSeen();
			let nicknames = main.nicknames();
			let serverData = main.serverData();
			let unseenHighlights = main.unseenHighlights();
			let unseenConversations = main.unseenConversations();
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
					awakeTime: awakeTime.toISOString(),
					friendsList: friends.currentFriendsList(),
					ircConfig: ircConfig.safeIrcConfigDict(results.ircConfig),
					ircConnectionState: ircConn.currentIrcConnectionState(),
					lastSeenChannels: lastSeen.lastSeenChannels(),
					lastSeenUsers: lastSeen.lastSeenUsers(),
					nicknames: nicknames.nicknamesDict(),
					onlineFriends: userLists.currentOnlineFriends(),
					serverData: serverData.getAllServerData(),
					token: routeUtils.getUsedToken(req),
					unseenConversations: unseenConversations.unseenConversations(),
					unseenHighlights: Array.from(unseenHighlights.unseenHighlightIds()),
					viewState: viewState.currentViewState(),
					// Template-related
					enableScripts: true
				});
			});
		}
	};
};
