const async = require("async");
const lodash = require("lodash");

const configDefaults = require("../defaults");
const constants = require("../constants");
const routeUtils = require("../routeUtils");

module.exports = function(main) {
	return function(req, res) {
		const accepted = routeUtils.denyAccessWithoutToken(req, res, main);
		if (accepted) {
			async.parallel({
				ircConfig: main.loadIrcConfig,
				appConfig: main.loadAppConfig
			}, function(err, results) {
				if (err) {
					// TODO: handle lol
					throw err;
				}

				res.render("index", {
					// Variables
					appConfig: lodash.assign({}, configDefaults, results.appConfig),
					friendsList: main.currentFriendsList(),
					ircConfig: main.safeIrcConfigDict(results.ircConfig),
					ircConnectionState: main.currentIrcConnectionState(),
					lastSeenChannels: main.lastSeenChannels(),
					lastSeenUsers: main.lastSeenUsers(),
					nicknames: main.nicknamesDict(),
					onlineFriends: main.currentOnlineFriends(),
					token: routeUtils.getUsedToken(req),
					viewState: main.currentViewState(),
					// Template-related
					enableScripts: true,
					// Includes
					constants,
					lodash
				});
			});
		}
	};
};
