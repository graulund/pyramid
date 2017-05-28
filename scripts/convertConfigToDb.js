const _ = require("lodash");

const config = require("../config");
const dbSource = require("../server/db");

var db;

dbSource({ setDb: (_) => { db = _; } }, () => {

	const callback = (err) => {
		if (err) {
			throw err;
		}
	};

	var keyValues = _.omit(config, [
		// Properties handled separately
		"irc", "nicknames", "friends", "bestFriends",
		// No longer a thing
		"debug", "encoding", "nonPeople"
	]);

	// Key values
	_.forOwn(keyValues, (value, key) => {
		console.log("Adding key " + key);
		db.storeConfigValue(key, value, callback);
	});

	// Nicknames
	if (config.nicknames && config.nicknames.length) {
		config.nicknames.forEach((nickname) => {
			console.log("Adding nickname " + nickname);
			db.addNickname(nickname, callback);
		});
	}

	// Friends
	if (config.friends && config.friends.length) {
		config.friends.forEach((username) => {
			console.log("Adding friend " + username);
			db.addToFriends(0, username, false, callback);
		});
	}
	if (config.bestFriends && config.bestFriends.length) {
		config.bestFriends.forEach((username) => {
			console.log("Adding best friend " + username);
			db.addToFriends(0, username, true, callback);
		});
	}

	// IRC config
	if (config.irc && config.irc.length) {
		var serverId = 0;
		config.irc.forEach((server) => {
			serverId++;
			var serverData = _.omit(server, ["channels"]);
			serverData.hostname = serverData.hostname || serverData.server;
			serverData.nickname = serverData.nickname || serverData.username;
			console.log("Adding server " + server.name);
			db.addServerToIrcConfig(serverData, callback);

			if (server.channels && server.channels.length) {
				server.channels.forEach((channel) => {
					console.log("Adding channel " + channel);
					db.addChannelToIrcConfig(
						serverId, channel.replace(/^#/, ""), callback
					);
				});
			}
		});
	}
});
