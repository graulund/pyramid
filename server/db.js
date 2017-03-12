// PYRAMID
// Database logic

const path = require("path");
const sqlite = require("sqlite3");
const async = require("async");
const lodash = require("lodash");

const constants = require("./constants");

const ASC = 0, DESC = 1;

const getTimestamp = (t) => {

	if (t && t instanceof Date) {
		return t.toISOString();
	}

	return t;
};

const getDateFromTimestamp = (t) => {

	const timestamp = getTimestamp(t);

	if (timestamp) {
		return timestamp.split("T")[0];
	}

	return null;
};

const nameValueRowsToObject = (rows) => {
	var output = {};
	if (rows && rows.length) {
		rows.forEach((row) => {
			if (row && row.name) {
				output[row.name] = row.value;
			}
		})
	}

	return output;
};

const formatIn = (list) => {
	if (list && list instanceof Array) {
		const json = JSON.stringify(list);
		if (json) {
			return "(" + json.substr(1, json.length-2) + ")";
		}
	}

	return "()";
};

module.exports = function(main) {

	var db = new sqlite.Database(path.join(__dirname, "..", "data", "pyramid.db"));

	const close = () => { db.close() };

	const upsert = (updateQuery, insertQuery, params, callback) => {
		db.run(updateQuery, params, function(err, data) {
			if (err || !this.changes) {
				db.run(insertQuery, params, callback);
			}
			else {
				callback(err, data);
			}
		});
	};

	const dollarize = (data) => {
		const out = {};
		lodash.forOwn(data, (value, key) => {
			out["$" + key] = value;
		});
		return out;
	};

	const oq = (col, isDesc = false) => {
		const dir = isDesc ? "DESC" : "ASC";
		return `ORDER BY ${col} ${dir}`;
	};

	const sq = (table, selectCols, whereCols = []) => {
		const select = selectCols.join(", ");
		const where = whereCols.map((w) => `${w} = \$${w}`).join(" AND ");
		return `SELECT ${select} FROM ${table}` +
			(where ? ` WHERE ${where}` : "");
	};

	const uq = (table, setCols, whereCols) => {
		const set = setCols.map((s) => `${s} = \$${s}`).join(", ");
		const where = whereCols.map((w) => `${w} = \$${w}`).join(" AND ");
		return `UPDATE ${table} SET ${set} WHERE ${where}`;
	};

	const iq = (table, colNames) => {
		const cols = colNames.join(", ");
		const vals = colNames.map((c) => "$" + c).join(", ");
		return `INSERT INTO ${table} (${cols}) VALUES (${vals})`;
	};

	const dq = (table, whereCols) => {
		const where = whereCols.map((w) => `${w} = \$${w}`).join(" AND ");
		return `DELETE FROM ${table} WHERE ${where}`;
	};

	const getIrcServers = (callback) => {
		db.all(
			sq("ircServers", ["*"], ["isEnabled"]) + " " + oq("name"),
			dollarize({ isEnabled: 1 }),
			callback
		);
	};

	const getIrcChannels = (callback) => {
		db.all(
			sq("ircChannels", ["*"], ["isEnabled"]) + " " + oq("name"),
			dollarize({ isEnabled: 1 }),
			callback
		);
	};

	const getIrcServer = (serverId, callback) => {
		db.get(
			sq("ircServers", ["*"], ["serverId"]),
			dollarize({ serverId }),
			callback
		);
	};

	const getIrcChannel = (channelId, callback) => {
		db.get(
			sq("ircChannels", ["*"], ["channelId"]),
			dollarize({ channelId }),
			callback
		);
	};

	const getIrcConfig = (callback) => {
		var servers;

		async.waterfall([
			// Load servers
			getIrcServers,

			// Load channels
			(_servers, callback) => {
				servers = _servers;
				getIrcChannels(callback);
			},

			// Combine and serve
			(channels, callback) => {
				servers.forEach((server) => {
					if (server) {
						server.channels = [];
					}
				});

				channels.forEach((channel) => {
					if (channel && channel.serverId) {
						const s = servers.filter(
							(s) => s && s.serverId === channel.serverId
						);

						if (s && s.length) {
							s[0].channels.push(channel);
						}
					}
				});

				callback(null, servers);
			}
		], callback);
	};

	const getFriends = (callback) => {
		db.all(
			sq("friends", ["*"], ["isEnabled"]) + " " + oq("username", ASC),
			{ $isEnabled: 1 },
			callback
		);
	};

	const getFriend = (serverId, username, callback) => {
		db.get(
			sq("friends", ["*"], ["isEnabled", "serverId", "username"]),
			dollarize({ isEnabled: 1, serverId, username }),
			callback
		);
	};

	const addToFriends = (serverId, username, isBestFriend, callback) => {
		upsert(
			uq("friends", ["isBestFriend"], ["serverId", "username"]),
			iq("friends", ["serverId", "username", "isBestFriend"]),
			dollarize({ serverId, username, isBestFriend: +isBestFriend }),
			callback
		);
	};

	const modifyFriend = (friendId, data, callback) => {
		db.run(
			uq("friends", Object.keys(data), ["friendId"]),
			dollarize(lodash.assign({ friendId }, data)),
			callback
		);
	};

	const removeFromFriends = (friendId, callback) => {
		db.run(
			dq("friends", ["friendId"]),
			dollarize({ friendId }),
			callback
		);
	};

	const getServerId = (name, callback) => {
		db.get(
			sq("ircServers", ["serverId"], ["name"]),
			dollarize({ name }),
			callback
		);
	};

	const getServerName = (serverId, callback) => {
		db.get(
			sq("ircServers", ["name"], ["serverId"]),
			dollarize({ serverId }),
			callback
		);
	};

	const getChannelId = (serverName, channelName, callback) => {
		db.get(
			sq("ircChannels", ["serverId"], ["name"]),
			{ $name: serverName },
			function(err, row) {
				if (err) {
					callback(err);
				}
				else {
					const serverId = row["serverId"];
					db.get(
						sq("ircChannels", ["channelId"], ["name", "serverId"]),
						dollarize({ name: channelName, serverId }),
						callback
					);
				}
			}
		);
	};

	const getChannelUri = (serverId, channelName, callback) => {
		getServerName(serverId, (err, server) => {
			if (err) {
				callback(err);
			}
			else {
				const serverName = server.name;
				callback(null, path.join(serverName, channelName));
			}
		});
	};

	const getChannelUriFromId = (channelId, callback) => {
		getChannel(channelId, (err, channel) => {
			if (err) {
				callback(err);
			}
			else {
				getChannelUri(channel.serverId, channel.name, callback);
			}
		});
	};

	const getConfigValue = (name, callback) => {
		db.get(
			sq("config", ["value"], ["name"]),
			dollarize({ name }),
			(err, row) => {
				if (err) {
					callback(err);
				}
				else {
					callback(null, JSON.parse(row.value));
				}
			}
		);
	};

	const getAllConfigValues = (callback) => {
		db.all(
			sq("config", ["name", "value"]),
			(err, rows) => {
				if (err) {
					callback(err);
				}
				else {
					var obj = nameValueRowsToObject(rows);
					lodash.forOwn(obj, (value, key) => {
						obj[key] = JSON.parse(value);
					});
					callback(null, obj);
				}
			}
		);
	};

	const storeConfigValue = (name, value, callback) => {
		upsert(
			uq("config", ["value"], ["name"]),
			iq("config", ["name", "value"]),
			dollarize({ name, value: JSON.stringify(value) }),
			callback
		);
	};

	const getLinesForDate = (server, channelId, date, callback) => {
		db.all(
			sq("lines", ["*"], ["channelId", "date"]),
			dollarize({ channelId, date }),
			callback
		);
	};

	const storeLine = (channelId, line, callback) => {
		var eventData = null;
		if (
			(line.events && line.events.length) ||
			(line.prevIds && line.prevIds.length)
		) {
			eventData = { events: line.events, prevIds: line.prevIds };
		}

		db.run(
			iq("lines", [
				"lineId",
				"channelId",
				"type",
				"time",
				"date",
				"username",
				"message",
				"symbol",
				"tags",
				"eventData"
			]),
			{
				$lineId: line.id,
				$channelId: channelId,
				$type: line.type,
				$time: getTimestamp(line.time),
				$date: getDateFromTimestamp(line.time),
				$username: line.username,
				$message: line.message,
				$symbol: line.symbol,
				$tags: line.tags && JSON.stringify(line.tags),
				$eventData: eventData && JSON.stringify(eventData)
			},
			callback
		);
	};

	const deleteLinesWithLineIds = (lineIds, callback) => {
		db.run(
			"DELETE FROM lines WHERE lineId IN " + formatIn(lineIds),
			callback
		);
	};

	const getNicknames = (callback) => {
		const prepareNicknameListValue = (list) => {
			if (list) {
				return list.split("\n");
			}

			return list;
		};

		const prepareNicknameValues = (err, data) => {
			if (data && data.length) {
				data.forEach((item) => {
					[
						"channelBlacklist", "channelWhitelist",
						"serverBlacklist", "serverWhitelist"
					].forEach((key) => {
						if (item[key]) {
							item[key] = prepareNicknameListValue(item[key]);
						}
					});
				});
			}

			callback(err, data);
		};

		db.all(
			sq("nicknames", ["*"]) + " " + oq("nickname", ASC),
			prepareNicknameValues
		);
	};

	const addNickname = (nickname, callback) => {
		console.log("AddNickname",
			iq("nicknames", ["nickname"]),
			dollarize({ nickname })
		);
		db.run(
			iq("nicknames", ["nickname"]),
			dollarize({ nickname }),
			callback
		);
	};

	const modifyNickname = (nickname, data, callback) => {
		const keys = Object.keys(data);

		keys.forEach((key) => {
			if (data[key] && data[key] instanceof Array) {
				data[key] = data[key].join("\n").toLowerCase() || null;
			}
		});

		db.run(
			uq("nicknames", keys, ["nickname"]),
			dollarize(lodash.assign({ nickname }, data)),
			callback
		);
	};

	const removeNickname = (nickname, callback) => {
		console.log("removeNickname",
			dq("nicknames", ["nickname"]),
			dollarize({ nickname })
		);
		db.run(
			dq("nicknames", ["nickname"]),
			dollarize({ nickname }),
			callback
		);
	};

	const addServerToIrcConfig = (data, callback) => {
		db.run(
			iq(
				"ircServers",
				["name", "hostname", "port", "secure", "username", "password", "nickname"]
			),
			{
				$name: data.name,
				$hostname: data.hostname,
				$port: data.port || 6667,
				$secure: +(data.secure || false),
				$username: data.username,
				$password: data.password,
				$nickname: data.nickname
			},
			callback
		);
	};

	const modifyServerInIrcConfig = (serverId, data, callback) => {
		db.run(
			uq("ircServers", Object.keys(data), ["serverId"]),
			dollarize(lodash.assign({ serverId }, data)),
			callback
		);
	};

	const removeServerFromIrcConfig = (serverId, callback) => {
		db.run(
			uq("ircServers", ["isEnabled"], ["serverId"]),
			dollarize({ isEnabled: 0, serverId }),
			callback
		);
	};

	const addChannelToIrcConfig = (serverId, name, callback) => {
		db.run(
			iq("ircChannels", ["serverId", "name"]),
			dollarize({ serverId, name }),
			callback
		);
	};

	const modifyChannelInIrcConfig = (channelId, data, callback) => {
		db.run(
			uq("ircChannels", Object.keys(data), ["channelId"]),
			dollarize(lodash.assign({ channelId }, data)),
			callback
		);
	};

	const removeChannelFromIrcConfig = (channelId, callback) => {
		db.run(
			uq("ircChannels", ["isEnabled"], ["channelId"]),
			dollarize({ isEnabled: 0, channelId }),
			callback
		);
	};

	const getLastSeenChannels = (callback) => {
		getIrcChannels((err, channels) => {
			if (err) {
				callback(err);
			}
			else {
				const parallelCalls = channels.map((channel) => {
					return function(callback) {
						getChannelUri(channel.serverId, channel.name, callback);
					};
				});
				async.parallel(parallelCalls, (err, channelUris) => {
					const output = {};
					channels.forEach((channel, i) => {
						const { lastSeenTime, lastSeenUsername } = channel;
						output[channelUris[i]] = {
							time: lastSeenTime,
							username: lastSeenUsername
						};
					});

					callback(null, output);
				});
			}
		});
	};

	// TODO: Add server name to usernames

	const getLastSeenUsers = (callback) => {
		getFriends((err, friends) => {
			if (err) {
				callback(err);
			}
			else {
				const parallelCalls = friends.map((friend) => {
					return function(callback) {
						if (friend.lastSeenChannelId) {
							getChannelUriFromId(friend.lastSeenChannelId, callback);
						}
						else {
							callback(null, null);
						}
					};
				});
				async.parallel(parallelCalls, (err, channelUris) => {
					const output = {};
					friends.forEach((friend, i) => {
						const { lastSeenTime, lastSeenChannelId, username } = friend;
						if (lastSeenTime && lastSeenChannelId) {
							output[username] = {
								time: lastSeenTime,
								channel: lastSeenUsername
							};
						}
					});

					callback(null, output);
				});

			}
		});
	};

	const getFriendsList = (callback) => {
		getFriends((err, friends) => {
			if (err) {
				callback(err);
			}
			else {
				const friendsList = {
					[constants.RELATIONSHIP_FRIEND]: [],
					[constants.RELATIONSHIP_BEST_FRIEND]: []
				};

				friends.forEach((friend, i) => {
					const { isBestFriend, username } = friend;
					if (isBestFriend) {
						friendsList[constants.RELATIONSHIP_BEST_FRIEND].push(username);
					}
					else {
						friendsList[constants.RELATIONSHIP_FRIEND].push(username);
					}
				});

				callback(null, friendsList);
			}
		});
	};

	/*

	API:

	addChannelToIrcConfig(serverId, name, callback)
	addNickname(nickname, callback)
	addServerToIrcConfig(data, callback)
	addToFriends(serverId, username, isBestFriend, callback)
	close()
	deleteLinesWithLineIds(lineIds, callback)
	getAllConfigValues(callback)
	getChannelId(serverName, channelName, callback)
	getChannelUri(serverId, channelName, callback)
	getConfigValue(name, callback)
	getFriend(serverId, username, callback)
	getFriends(callback)
	getFriendsList(callback)
	getIrcChannel(channelId, callback)
	getIrcChannels(callback)
	getIrcConfig(callback)
	getIrcServer(serverId, callback)
	getIrcServers(callback)
	getLastSeenChannels(callback)
	getLastSeenUsers(callback)
	getLinesForDate(server, channelId, date, callback)
	getNicknames(callback)
	getServerId(name, callback)
	getServerName(serverId, callback)
	modifyChannelInIrcConfig(channelId, data, callback)
	modifyFriend(friendId, data, callback)
	modifyNickname(nickname, data, callback)
	modifyServerInIrcConfig(serverId, data, callback)
	removeChannelFromIrcConfig(channelId, callback)
	removeFromFriends(friendId, callback)
	removeNickname(nickname, callback)
	removeServerFromIrcConfig(serverId, callback)
	storeConfigValue(name, value, callback)
	storeLine(channelId, line, callback)

	*/

	const output = {
		addChannelToIrcConfig,
		addNickname,
		addServerToIrcConfig,
		addToFriends,
		close,
		deleteLinesWithLineIds,
		getAllConfigValues,
		getChannelId,
		getChannelUri,
		getConfigValue,
		getFriend,
		getFriends,
		getFriendsList,
		getIrcChannel,
		getIrcChannels,
		getIrcConfig,
		getIrcServer,
		getIrcServers,
		getLastSeenChannels,
		getLastSeenUsers,
		getLinesForDate,
		getNicknames,
		getServerId,
		getServerName,
		modifyChannelInIrcConfig,
		modifyFriend,
		modifyNickname,
		modifyServerInIrcConfig,
		removeChannelFromIrcConfig,
		removeFromFriends,
		removeNickname,
		removeServerFromIrcConfig,
		storeConfigValue,
		storeLine
	};

	main.setDb(output);
	return output;
};
