const constants = require("../constants");

const getRelationship = function(username, friendsList) {

	if (username) {
		username = username.toLowerCase();

		const bestFriends = friendsList[constants.RELATIONSHIP_BEST_FRIEND] || [];
		const friends = friendsList[constants.RELATIONSHIP_FRIEND] || [];

		if (bestFriends.indexOf(username) >= 0) {
			return constants.RELATIONSHIP_BEST_FRIEND;
		}

		if (friends.indexOf(username) >= 0) {
			return constants.RELATIONSHIP_FRIEND;
		}
	}

	return constants.RELATIONSHIP_NONE;
};

module.exports = {
	getRelationship
};
