const twitchApi = require("./twitchApi");
const util = require("./util");

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
				util.warn(
					"Error occurred trying to get user info: " +
					(error && error.message)
				);
				callback(error);
			}
		})
	);
};

module.exports = {
	requestTwitchUserInfo
};
