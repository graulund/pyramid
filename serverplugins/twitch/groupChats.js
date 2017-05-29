const twitchApi = require("./twitchApi");

var warn = console.warn;

const requestGroupChatInfo = function(client, callback) {
	twitchApi.chatdepotGetRequest(
		"room_memberships",
		client.config.password,
		{},
		function(error, response, body) {
			if (!error && response.statusCode === 200) {
				try {
					const data = JSON.parse(body);
					const memberships = data.memberships;
					const groupChats = [];
					memberships.forEach((membership) => {
						let { room } = membership;
						if (membership.is_confirmed) {
							groupChats.push({
								name: room.irc_channel,
								displayName: room.display_name
							});
						}
					});

					callback(null, groupChats);
				}
				catch(e) {
					warn(
						"Error occurred trying to get group chat info",
						e
					);

					callback(e);
				}
			} else {
				callback(error);
			}
		}
	);
};

module.exports = {
	requestGroupChatInfo
};
