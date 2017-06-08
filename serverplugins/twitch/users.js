const twitchApi = require("./twitchApi");

var warn = console.warn;

const requestTwitchUserInfo = function(username, callback) {
	twitchApi.krakenGetRequest(
		"users",
		{ login: username },
		function(error, response, body) {
			if (!error && response.statusCode === 200) {
				try {
					const data = JSON.parse(body);
					const user = data.users && data.users[0];
					if (user) {
						callback(null, user);
					}
					else {
						callback(null, null);
					}
				}
				catch(e) {
					error = e;
				}
			}

			if (error) {
				warn(
					"Error occurred trying to get user info",
					error
				);
				callback(error);
			}
		}
	);
};

module.exports = {
	requestTwitchUserInfo
};
