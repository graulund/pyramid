const twitchApi = require("./twitchApi");
const util = require("./util");

var warn = console.warn;

const requestTwitchUserInfo = function(username, callback) {
	twitchApi.krakenGetRequest(
		"users",
		{ login: username },
		util.acceptRequest(function(error, data) {
			if (!error) {
				const user = data.users && data.users[0];
				if (user) {
					callback(null, user);
				}
				else {
					callback(null, null);
				}
			}

			else {
				warn(
					"Error occurred trying to get user info\n",
					error
				);
				callback(error);
			}
		})
	);
};

module.exports = {
	requestTwitchUserInfo
};
