const stringUtils = require("../../server/util/strings");
const twitchApi = require("./twitchApi");
const util = require("./util");

var warn = console.warn;

const requestGroupChatInfo = function(client, callback) {
	twitchApi.chatdepotGetRequest(
		"room_memberships",
		client.config.password,
		{},
		util.acceptRequest(function(error, data) {
			if (!error) {
				const memberships = data.memberships;
				const groupChats = [];
				memberships.forEach((membership) => {
					let { room } = membership;
					if (membership.is_confirmed) {
						groupChats.push({
							name: room.irc_channel,
							displayName: stringUtils.clean(room.display_name)
						});
					}
				});

				callback(null, groupChats);
			}
			else {
				warn(
					"Error occurred trying to get group chat info\n",
					error
				);
				callback(error);
			}
		})
	);
};

module.exports = {
	requestGroupChatInfo
};
