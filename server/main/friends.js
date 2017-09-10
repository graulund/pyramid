const async = require("async");

module.exports = function(db, restriction) {

	var currentFriendsList = [];
	var friendIdCache = {};

	const getFriends = function(callback) {
		db.getFriends(callback);
	};

	const getFriendsList = function(callback) {
		db.getFriendsList(callback);
	};

	const loadFriendsList = function(callback) {
		getFriendsList((err, data) => {
			if (err) {
				if (typeof callback === "function") {
					callback(err);
				}
			}
			else {
				currentFriendsList = data;
				generateFriendIdCache();
				if (typeof callback === "function") {
					callback(null, data);
				}
			}
		});
	};

	const generateFriendIdCache = function() {
		const friendIds = {};
		getFriends((err, data) => {
			if (!err && data) {
				data.forEach((friend) => {
					if (friend && friend.friendId && friend.username) {
						friendIds[friend.username] = friend.friendId;
					}
				});
				friendIdCache = friendIds;
			}
		});
	};

	const addToFriends = function(serverId, username, isBestFriend, callback) {
		isFriendsLimitReached(function(reached) {
			if (reached) {
				callback(new Error("Friends limit reached"));
			}

			else {
				db.addToFriends(serverId, username, isBestFriend, callback);
			}
		});
	};

	// TODO: Use server name instead of server id here
	const modifyFriend = function(serverId, username, data, callback) {
		async.waterfall([
			(callback) => db.getFriend(serverId, username, callback),
			(friend, callback) => db.modifyFriend(friend.friendId, data, callback)
		], callback);
	};

	const removeFromFriends = function(serverId, username, callback) {
		async.waterfall([
			(callback) => db.getFriend(serverId, username, callback),
			(friend, callback) => db.removeFromFriends(friend.friendId, callback)
		], callback);
	};

	const isFriendsLimitReached = function(callback) {
		if (!restriction) {
			callback(false);
		}

		else {
			db.getFriendCount(function(err, data) {
				let reached = data && data.count >= restriction.friendsLimit;
				callback(reached);
			});
		}
	};

	return {
		currentFriendsList: () => currentFriendsList,
		friendIdCache: () => friendIdCache,
		getFriends,
		getFriendsList,
		loadFriendsList,
		addToFriends,
		modifyFriend,
		removeFromFriends
	};
};
