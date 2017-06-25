// PYRAMID
// Database logic

const fs = require("fs");
const path = require("path");

const _ = require("lodash");
const async = require("async");
const mkdirp = require("mkdirp");
const sqlite = require("sqlite3");

const constants = require("./constants");
const channelUtils = require("./util/channels");
const fileUtils = require("./util/files");
const timeUtils = require("./util/time");

const ASC = 0, DESC = 1;

const DB_FILENAME = constants.DB_FILENAME;

const excludeEventLinesQuery =
	"lines.type NOT IN ('join', 'part', 'quit', 'kick', 'kill', 'mode')";

// Create db

const createDatabaseFromEmpty = function(callback) {
	const source = path.join(constants.PROJECT_ROOT, "pyramid-empty.db");
	const target = DB_FILENAME;

	fs.access(target, (err) => {
		if (err) {
			// If the file did not exist, let's copy
			mkdirp(path.dirname(target), (err) => {
				if (err) {
					callback(err);
				}
				else {
					console.log("Created a new database from empty template");
					fileUtils.copyFile(source, target, callback);
				}
			});
		} else {
			// If the file already exists, abort silently
			return callback();
		}
	});
};

// Callback utility

const dbCallback = function(callback) {
	return function(err, data) {
		if (err) {
			console.error("SQL error occurred:", err);
		}
		if (typeof callback === "function") {
			callback(err, data);
		}
	};
};

// Query utility

const getTimestamp = (t) => {

	if (t && t instanceof Date) {
		return t.toISOString();
	}

	return t;
};

const nameValueRowsToObject = (rows) => {
	var output = {};
	if (rows && rows.length) {
		rows.forEach((row) => {
			if (row && row.name) {
				output[row.name] = row.value;
			}
		});
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

const dollarize = (data) => {
	const out = {};
	_.forOwn(data, (value, key) => {
		out["$" + key] = value;
	});
	return out;
};

const onlyParamsInQuery = (params, query) => {
	const out = {};

	if (params && query) {
		_.forOwn(params, (value, key) => {
			if (query.indexOf(key) >= 0) {
				out[key] = value;
			}
		});
	}

	return out;
};

const oq = (col, isDesc = false) => {
	const dir = isDesc ? "DESC" : "ASC";
	return `ORDER BY ${col} ${dir}`;
};

const sq = (table, selectCols, whereCols = [], joins = "") => {
	const select = selectCols.join(", ");
	const where = whereCols.map((w) => `${w} = \$${w}`).join(" AND ");
	return `SELECT ${select} FROM ${table}` +
		(joins ? " " + joins : "") +
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

const initializeDb = function(db) {
	// Set up SQLite settings
	db.run("PRAGMA journal_mode=WAL");
	db.run("PRAGMA synchronous=NORMAL");
};

const mainMethods = function(main, db) {

	const getLocalDatestampFromTime = (time) => {
		return timeUtils.ymd(main.logs().localMoment(time));
	};

	const close = () => { db.close(); };

	const upsert = (updateQuery, insertQuery, params, callback) => {
		db.run(
			updateQuery,
			onlyParamsInQuery(params, updateQuery),
			function(err, data) {
				if (err || !this.changes) {
					db.run(
						insertQuery,
						onlyParamsInQuery(params, insertQuery),
						dbCallback(callback)
					);
				}
				else {
					callback(err, data);
				}
			}
		);
	};

	const getIrcServers = (callback) => {
		db.all(
			sq("ircServers", ["*"], ["isEnabled"]) + " " + oq("name"),
			dollarize({ isEnabled: 1 }),
			dbCallback(callback)
		);
	};

	const getIrcChannels = (callback) => {
		db.all(
			sq("ircChannels", ["*"], ["isEnabled"]) + " " + oq("name"),
			dollarize({ isEnabled: 1 }),
			dbCallback(callback)
		);
	};

	const getIrcServer = (serverId, callback) => {
		db.get(
			sq("ircServers", ["*"], ["serverId"]),
			dollarize({ serverId }),
			dbCallback(callback)
		);
	};

	const getIrcChannel = (channelId, callback) => {
		db.get(
			sq("ircChannels", ["*"], ["channelId"]),
			dollarize({ channelId }),
			dbCallback(callback)
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
		], dbCallback(callback));
	};

	const getFriends = (callback) => {
		db.all(
			sq("friends", ["*"], ["isEnabled"]) + " " + oq("username", ASC),
			{ $isEnabled: 1 },
			dbCallback(callback)
		);
	};

	const getFriendsWithChannelInfo = (callback) => {
		db.all(
			sq(
				"friends",
				[
					"friends.*",
					"ircChannels.name AS channelName",
					"ircChannels.channelType",
					"ircServers.name AS serverName"
				]
			) +
			" " +
			"INNER JOIN ircChannels ON " +
				"friends.lastSeenChannelId = ircChannels.channelId " +
			"INNER JOIN ircServers ON " +
				"ircChannels.serverId = ircServers.serverId " +
			"WHERE friends.isEnabled = $isEnabled " +
			oq("username", ASC),
			{ $isEnabled: 1 },
			dbCallback(callback)
		);
	};

	const getFriend = (serverId, username, callback) => {
		db.get(
			sq("friends", ["*"], ["isEnabled", "serverId", "username"]),
			dollarize({ isEnabled: 1, serverId, username }),
			dbCallback(callback)
		);
	};

	const addToFriends = (serverId, username, isBestFriend, callback) => {
		upsert(
			uq("friends", ["isBestFriend", "isEnabled"], ["serverId", "username"]),
			iq("friends", ["serverId", "username", "isBestFriend"]),
			dollarize({ serverId, username, isBestFriend: +isBestFriend, isEnabled: 1 }),
			callback
		);
	};

	const modifyFriend = (friendId, data, callback) => {
		if (data.lastSeenTime) {
			data.lastSeenTime = getTimestamp(data.lastSeenTime);
		}

		db.run(
			uq("friends", Object.keys(data), ["friendId"]),
			dollarize(_.assign({ friendId }, data)),
			dbCallback(callback)
		);
	};

	const removeFromFriends = (friendId, callback) => {
		db.run(
			dq("friends", ["friendId"]),
			dollarize({ friendId }),
			dbCallback(callback)
		);
	};

	const getServerId = (name, callback) => {
		db.get(
			sq("ircServers", ["serverId"], ["name"]),
			dollarize({ name }),
			dbCallback(callback)
		);
	};

	const getServerName = (serverId, callback) => {
		db.get(
			sq("ircServers", ["name"], ["serverId"]),
			dollarize({ serverId }),
			dbCallback(callback)
		);
	};

	const getChannelId = (serverName, channelName, callback) => {
		getServerId(
			serverName,
			function(err, row) {
				if (err) {
					callback(err);
				}
				else {
					if (row) {
						const serverId = row.serverId;
						db.get(
							sq("ircChannels", ["channelId"], ["name", "serverId"]),
							dollarize({ name: channelName, serverId }),
							dbCallback(callback)
						);
					}
					else {
						callback(null, null);
					}
				}
			}
		);
	};

	const getConfigValue = (name, callback) => {
		db.get(
			sq("config", ["value"], ["name"]),
			dollarize({ name }),
			dbCallback(function(err, row) {
				if (err) {
					callback(err);
				}
				else {
					callback(null, row && JSON.parse(row.value));
				}
			})
		);
	};

	const getAllConfigValues = (callback) => {
		db.all(
			sq("config", ["name", "value"]),
			dbCallback(function(err, rows) {
				if (err) {
					callback(err);
				}
				else {
					var obj = nameValueRowsToObject(rows);
					_.forOwn(obj, (value, key) => {
						obj[key] = JSON.parse(value);
					});
					callback(null, obj);
				}
			})
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
		db.run(
			iq("nicknames", ["nickname"]),
			dollarize({ nickname }),
			dbCallback(callback)
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
			dollarize(_.assign({ nickname }, data)),
			dbCallback(callback)
		);
	};

	const removeNickname = (nickname, callback) => {
		db.run(
			dq("nicknames", ["nickname"]),
			dollarize({ nickname }),
			dbCallback(callback)
		);
	};

	const addServerToIrcConfig = (data, callback) => {
		upsert(
			uq(
				"ircServers",
				[
					"hostname", "port", "secure", "username",
					"password", "nickname", "isEnabled"
				],
				["name"]
			),
			iq(
				"ircServers",
				[
					"name", "hostname", "port", "secure",
					"username", "password", "nickname", "isEnabled"
				]
			),
			{
				$name: data.name,
				$hostname: data.hostname,
				$port: data.port || 6667,
				$secure: +(data.secure || false),
				$username: data.username,
				$password: data.password,
				$nickname: data.nickname,
				$isEnabled: 1
			},
			dbCallback(callback)
		);
	};

	const modifyServerInIrcConfig = (serverId, data, callback) => {
		db.run(
			uq("ircServers", Object.keys(data), ["serverId"]),
			dollarize(_.assign({ serverId }, data)),
			dbCallback(callback)
		);
	};

	const removeServerFromIrcConfig = (serverId, callback) => {
		db.run(
			uq("ircServers", ["isEnabled"], ["serverId"]),
			dollarize({ isEnabled: 0, serverId }),
			dbCallback(callback)
		);
	};

	const addChannelToIrcConfig = (serverId, name, data, callback) => {
		data = data || {};
		let dataKeys = Object.keys(data);
		upsert(
			uq("ircChannels", ["isEnabled"].concat(dataKeys), ["serverId", "name"]),
			iq("ircChannels", ["serverId", "name", "isEnabled"].concat(dataKeys)),
			dollarize(_.assign({ serverId, name, isEnabled: 1 }, data)),
			dbCallback(callback)
		);
	};

	const modifyChannelInIrcConfig = (channelId, data, callback) => {
		if (data.lastSeenTime) {
			data.lastSeenTime = getTimestamp(data.lastSeenTime);
		}

		db.run(
			uq("ircChannels", Object.keys(data), ["channelId"]),
			dollarize(_.assign({ channelId }, data)),
			dbCallback(callback)
		);
	};

	const removeChannelFromIrcConfig = (channelId, callback) => {
		db.run(
			uq("ircChannels", ["isEnabled"], ["channelId"]),
			dollarize({ isEnabled: 0, channelId }),
			dbCallback(callback)
		);
	};

	const getLastSeenChannels = (callback) => {
		getIrcChannels((err, channels) => {
			if (err) {
				callback(err);
			}
			else {
				// Resolve server names
				let serverIds = _.uniq(channels.map((channel) => channel.serverId));
				let calls = serverIds.map((s) => {
					return (callback) => getServerName(s, (err, data) => {
						callback(err, { id: s, data });
					});
				});

				async.parallel(calls, (err, serverNames) => {
					let output = {};
					channels.forEach((channel) => {
						let {
							lastSeenTime,
							lastSeenUsername,
							lastSeenDisplayName,
							name,
							channelType,
							serverId
						} = channel;

						// Find server name

						var serverName;

						if (serverId) {
							serverNames.forEach((s) => {
								if (s.id === serverId) {
									serverName = s.data && s.data.name;
								}
							});
						}

						// Get URI and add to list

						if (
							serverName &&
							lastSeenTime &&
							lastSeenUsername &&
							channelType === constants.CHANNEL_TYPES.PUBLIC
						) {
							let channelUri = channelUtils.getChannelUri(
								serverName,
								name,
								channelType
							);

							output[channelUri] = {
								time: lastSeenTime,
								userDisplayName: lastSeenDisplayName,
								username: lastSeenUsername
							};
						}
					});

					callback(null, output);
				});
			}
		});
	};

	// TODO: Add server name to usernames

	const getLastSeenUsers = (callback) => {
		getFriendsWithChannelInfo((err, friends) => {
			if (err) {
				callback(err);
			}
			else {
				const output = {};
				friends.forEach((friend) => {
					const {
						displayName,
						lastSeenTime,
						lastSeenChannelId,
						username
					} = friend;

					if (lastSeenTime && lastSeenChannelId) {
						output[username] = {
							displayName,
							time: lastSeenTime,
							channel: channelUtils.getChannelUri(
								friend.serverName,
								friend.channelName,
								friend.channelType
							)
						};
					}
				});

				callback(null, output);
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

				friends.forEach((friend) => {
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

	const getLines = (where, direction, limit, args, callback) => {
		db.all(
			sq(
				"lines",
				[
					"lines.*",
					"ircChannels.name AS channelName",
					"ircChannels.channelType",
					"ircServers.name AS serverName"
				]
			) +
			" " +
			"INNER JOIN ircChannels ON " +
				"lines.channelId = ircChannels.channelId " +
			"INNER JOIN ircServers ON " +
				"ircChannels.serverId = ircServers.serverId " +
			where + " " +
			oq("lines.time", direction) + " " +
			"LIMIT " + limit,
			args,
			dbCallback(callback)
		);
	};

	const getDateLines = (where, args, options, callback) => {
		options = options || {};
		const limit = options.pageNumber
			? ((options.pageNumber-1) * constants.LOG_PAGE_SIZE) +
				", " + constants.LOG_PAGE_SIZE
			: constants.LOG_PAGE_SIZE;

		var whereSince = "";

		if (options.sinceTime instanceof Date) {
			whereSince = "AND lines.time >= $sinceTime ";
			args.$sinceTime = options.sinceTime.toISOString();
		}

		getLines(
			where + " " + whereSince,
			ASC,
			limit,
			args,
			callback
		);
	};

	const getDateLinesForChannel = (channelId, date, options, callback) => {
		getDateLines(
			"WHERE lines.channelId = $channelId " +
			"AND lines.date = $date",
			dollarize({ channelId, date }),
			options,
			callback
		);
	};

	const getDateLinesForUsername = (username, date, options, callback) => {
		getDateLines(
			"WHERE lines.username = $username " +
			"AND lines.date = $date " +
			"AND " + excludeEventLinesQuery,
			dollarize({ username, date }),
			options,
			callback
		);
	};

	const getMostRecentLines = (where, limit, args, beforeTime, callback) => {
		args = args || {};
		let beforeTimeLine = "";

		if (beforeTime) {
			beforeTimeLine = (where ? " AND " : "WHERE ") +
				"lines.time < $beforeTime";
			args["$beforeTime"] = getTimestamp(beforeTime);
		}

		getLines(
			where + beforeTimeLine,
			DESC,
			limit,
			args,
			callback
		);
	};

	const getMostRecentChannelLines = (channelId, limit, beforeTime, callback) => {
		getMostRecentLines(
			"WHERE lines.channelId = $channelId",
			limit,
			dollarize({ channelId }),
			beforeTime,
			callback
		);
	};

	const getMostRecentUserLines = (username, limit, beforeTime, callback) => {
		// TODO: Somehow include connection event lines
		getMostRecentLines(
			"WHERE lines.username = $username " +
			"AND " + excludeEventLinesQuery,
			limit,
			dollarize({ username }),
			beforeTime,
			callback
		);
	};

	const getMostRecentAllFriendsLines = (limit, beforeTime, callback) => {
		// TODO: Somehow include connection event lines
		getMostRecentLines(
			"WHERE lines.username IN (SELECT username FROM friends) " +
			"AND " + excludeEventLinesQuery,
			limit,
			{},
			beforeTime,
			callback
		);
	};

	const getMostRecentHighlightsLines = (limit, beforeTime, callback) => {
		// TODO: Somehow include connection event lines
		getMostRecentLines(
			"WHERE lines.isHighlight = 1",
			limit,
			{},
			beforeTime,
			callback
		);
	};

	const getDateLineCountForChannel = (channelId, date, callback) => {
		db.get(
			sq("lines", ["COUNT(*) AS count"], ["channelId", "date"]),
			dollarize({ channelId, date }),
			dbCallback(callback)
		);
	};

	const getDateLineCountForUsername = (username, date, callback) => {
		// TODO: Exclude event lines, because they are not reliable in user logs
		db.get(
			sq("lines", ["COUNT(*) AS count"], ["username", "date"]),
			dollarize({ username, date }),
			dbCallback(callback)
		);
	};

	const storeLine = (channelId, line, callback) => {
		const { argument, by, events, highlight, mode, prevIds, reason, status } = line;
		var eventData = null;

		// Bunched events
		if (
			(events && events.length) ||
			(prevIds && prevIds.length)
		) {
			eventData = { events, prevIds };
		}

		// Connection events
		else if (status) {
			eventData = { status };
		}

		// Part/quit/kick/kill events
		else if (reason) {
			eventData = { reason };

			if (by) {
				eventData.by = by;
			}
		}

		// Mode events
		else if (mode) {
			eventData = { mode };

			if (argument) {
				eventData.argument = argument;
			}
		}

		let isHighlight = null;

		if (highlight && highlight.length) {
			eventData = _.assign(eventData || {}, { highlight });
			isHighlight = 1;
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
				"eventData",
				"isHighlight"
			]),
			{
				$lineId: line.lineId,
				$channelId: channelId,
				$type: line.type,
				$time: getTimestamp(line.time),
				$date: getLocalDatestampFromTime(line.time),
				$username: line.username,
				$message: line.message,
				$symbol: line.symbol,
				$tags: line.tags && JSON.stringify(line.tags),
				$eventData: eventData && JSON.stringify(eventData),
				$isHighlight: isHighlight
			},
			dbCallback(callback)
		);
	};

	const deleteLinesWithLineIds = (lineIds, callback) => {
		db.run(
			"DELETE FROM lines WHERE lineId IN " + formatIn(lineIds),
			dbCallback(callback)
		);
	};

	const getLineByLineId = (lineId, callback) => {
		db.get(
			sq("lines", ["*"], ["lineId"]),
			dollarize({ lineId }),
			dbCallback(callback)
		);
	};

	/*

	API:

	addChannelToIrcConfig(serverId, name, data, callback)
	addNickname(nickname, callback)
	addServerToIrcConfig(data, callback)
	addToFriends(serverId, username, isBestFriend, callback)
	close()
	deleteLinesWithLineIds(lineIds, callback)
	getAllConfigValues(callback)
	getChannelId(serverName, channelName, callback)
	getConfigValue(name, callback)
	getDateLineCountForChannel(channelId, date, callback)
	getDateLineCountForUsername(username, date, callback)
	getDateLinesForChannel(channelId, date, options, callback)
	getDateLinesForUsername(username, date, options, callback)
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
	getLineByLineId(lineId, callback)
	getMostRecentAllFriendsLines(limit, beforeTime, callback)
	getMostRecentChannelLines(channelId, limit, beforeTime, callback)
	getMostRecentHighlightsLines(limit, beforeTime, callback)
	getMostRecentUserLines(username, limit, beforeTime, callback)
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
		_db: db,
		addChannelToIrcConfig,
		addNickname,
		addServerToIrcConfig,
		addToFriends,
		close,
		deleteLinesWithLineIds,
		getAllConfigValues,
		getChannelId,
		getConfigValue,
		getDateLineCountForChannel,
		getDateLineCountForUsername,
		getDateLinesForChannel,
		getDateLinesForUsername,
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
		getLineByLineId,
		getMostRecentAllFriendsLines,
		getMostRecentChannelLines,
		getMostRecentHighlightsLines,
		getMostRecentUserLines,
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
};

module.exports = function(main, callback) {
	// Create database if needed
	createDatabaseFromEmpty((err) => {
		if (err) {
			throw err;
		}
		else {
			// Open database
			var db = new sqlite.Database(DB_FILENAME);
			initializeDb(db);
			mainMethods(main, db);

			if (typeof callback === "function") {
				callback();
			}
		}
	});
};
