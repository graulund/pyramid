const constants = require("../constants");

module.exports = function(db) {

	var lastSeenChannels = {};
	var lastSeenUsers = {};

	var cachedLastSeens = {};

	const getLastSeenChannels = function(callback) {
		db.getLastSeenChannels(callback);
	};

	const getLastSeenUsers = function(callback) {
		db.getLastSeenUsers(callback);
	};

	const loadLastSeenChannels = function(callback) {
		getLastSeenChannels((err, data) => {
			if (err) {
				if (typeof callback === "function") {
					callback(err);
				}
			}
			else {
				lastSeenChannels = data;
				if (typeof callback === "function") {
					callback(null, data);
				}
			}
		});
	};

	const loadLastSeenUsers = function(callback) {
		getLastSeenUsers((err, data) => {
			if (err) {
				if (typeof callback === "function") {
					callback(err);
				}
			}
			else {
				lastSeenUsers = data;
				if (typeof callback === "function") {
					callback(null, data);
				}
			}
		});
	};

	const setLastSeenChannel = function(
		channel, data, channelIdCache
	) {
		if (data) {
			// Update
			lastSeenChannels[channel] = data;
			cachedLastSeens[`channel:${channel}`] = { channel, data };

			if (channelIdCache[channel]) {
				db.modifyChannelInIrcConfig(
					channelIdCache[channel],
					{
						lastSeenTime: data.time,
						lastSeenUsername: data.username,
						lastSeenDisplayName: data.userDisplayName
					}
				);
			}
		}
		else {
			// Delete
			delete lastSeenChannels[channel];
			delete cachedLastSeens[`channel:${channel}`];
		}
	};

	const setLastSeenUser = function(
		username, data, friendIdCache, channelIdCache
	) {
		if (data) {
			// Update
			lastSeenUsers[username] = data;
			cachedLastSeens[`user:${username}`] = { username, data };

			if (friendIdCache[username] && channelIdCache[data.channel]) {
				db.modifyFriend(
					friendIdCache[username],
					{
						lastSeenTime: data.time,
						lastSeenChannelId: channelIdCache[data.channel],
						displayName: data.displayName
					}
				);
			}
		}
		else {
			// Delete
			delete lastSeenUsers[username];
			delete cachedLastSeens[`user:${username}`];
		}
	};

	const updateLastSeen = function(
		channel, username, time, relationship, displayName,
		friendIdCache = {}, channelIdCache = {}
	) {
		setLastSeenChannel(
			channel,
			{ username, time, userDisplayName: displayName },
			channelIdCache
		);

		if (relationship >= constants.RELATIONSHIP_FRIEND) {
			setLastSeenUser(
				username,
				{ channel, time, displayName },
				friendIdCache,
				channelIdCache
			);
		}
	};

	const clearCachedLastSeens = function() {
		cachedLastSeens = {};
	};

	const flushCachedLastSeens = function() {
		const c = cachedLastSeens;
		clearCachedLastSeens();
		return c;
	};

	return {
		cachedLastSeens: () => cachedLastSeens,
		clearCachedLastSeens,
		flushCachedLastSeens,
		getLastSeenChannels,
		getLastSeenUsers,
		lastSeenChannels: () => lastSeenChannels,
		lastSeenUsers: () => lastSeenUsers,
		loadLastSeenChannels,
		loadLastSeenUsers,
		updateLastSeen
	};
};
