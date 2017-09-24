// PYRAMID
// Database logic

const fs = require("fs");
const path = require("path");

const _ = require("lodash");
const async = require("async");
const mkdirp = require("mkdirp");
const sqlite = require("sqlite3");

const constants = require("../constants");
const channelUtils = require("../util/channels");
const fileUtils = require("../util/files");
const pathUtils = require("../util/paths");
const timeUtils = require("../util/time");

const u = require("./util");

const ASC = 0, DESC = 1;

const excludeEventLinesQuery =
	"lines.type NOT IN ('join', 'part', 'quit', 'kick', 'kill', 'mode')";

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

// Create db

const createDatabaseFromEmpty = function(callback) {
	let source = path.join(constants.PROJECT_ROOT, "pyramid-empty.db");
	let target = pathUtils.getDatabaseFilename();

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

// Initialize db

const initializeDb = function(db) {
	// Set up SQLite settings
	db.run("PRAGMA journal_mode=WAL");
	db.run("PRAGMA synchronous=NORMAL");
};

const mainMethods = function(main, db) {

	const getLocalDatestampFromTime = function(time) {
		return timeUtils.ymd(main.logs().localMoment(time));
	};

	const close = () => { db.close(); };

	const upsert = function(updateQuery, insertQuery, params, callback) {
		db.run(
			updateQuery,
			u.onlyParamsInQuery(params, updateQuery),
			function(err, data) {
				if (err || !this.changes) {
					db.run(
						insertQuery,
						u.onlyParamsInQuery(params, insertQuery),
						dbCallback(callback)
					);
				}
				else {
					callback(err, data);
				}
			}
		);
	};

	const getIrcServers = function(callback) {
		db.all(
			u.sq("ircServers", ["*"], ["isEnabled"]) + " " + u.oq("name"),
			u.dollarize({ isEnabled: 1 }),
			dbCallback(callback)
		);
	};

	const getIrcServerCount = function(callback) {
		db.get(
			u.sq("ircServers", ["COUNT(*) AS count"], ["isEnabled"]),
			u.dollarize({ isEnabled: 1 }),
			dbCallback(callback)
		);
	};

	const getIrcChannels = function(callback) {
		db.all(
			u.sq("ircChannels", ["*"], ["isEnabled"]) + " " + u.oq("name"),
			u.dollarize({ isEnabled: 1 }),
			dbCallback(callback)
		);
	};

	const getIrcChannelCount = function(callback) {
		db.get(
			u.sq("ircChannels", ["COUNT(*) AS count"], ["isEnabled"]),
			u.dollarize({ isEnabled: 1 }),
			dbCallback(callback)
		);
	};

	const getIrcServer = function(serverId, callback) {
		db.get(
			u.sq("ircServers", ["*"], ["serverId"]),
			u.dollarize({ serverId }),
			dbCallback(callback)
		);
	};

	const getIrcChannel = function(channelId, callback) {
		db.get(
			u.sq("ircChannels", ["*"], ["channelId"]),
			u.dollarize({ channelId }),
			dbCallback(callback)
		);
	};

	const getIrcConfig = function(callback) {
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

						if (channel.channelConfig) {
							channel.channelConfig = JSON.parse(channel.channelConfig);
						}

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

	const getFriends = function(callback) {
		db.all(
			u.sq("friends", ["*"], ["isEnabled"]) + " " + u.oq("username", ASC),
			{ $isEnabled: 1 },
			dbCallback(callback)
		);
	};

	const getFriendCount = function(callback) {
		db.get(
			u.sq("friends", ["COUNT(*) AS count"], ["isEnabled"]),
			{ $isEnabled: 1 },
			dbCallback(callback)
		);
	};

	const getFriendsWithChannelInfo = function(callback) {
		db.all(
			u.sq(
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
			u.oq("username", ASC),
			{ $isEnabled: 1 },
			dbCallback(callback)
		);
	};

	const getFriend = function(serverId, username, callback) {
		db.get(
			u.sq("friends", ["*"], ["isEnabled", "serverId", "username"]),
			u.dollarize({ isEnabled: 1, serverId, username }),
			dbCallback(callback)
		);
	};

	const addToFriends = function(serverId, username, isBestFriend, callback) {
		upsert(
			u.uq("friends", ["isBestFriend", "isEnabled"], ["serverId", "username"]),
			u.iq("friends", ["serverId", "username", "isBestFriend"]),
			u.dollarize({ serverId, username, isBestFriend: +isBestFriend, isEnabled: 1 }),
			callback
		);
	};

	const modifyFriend = function(friendId, data, callback) {
		if (data.lastSeenTime) {
			data.lastSeenTime = u.getTimestamp(data.lastSeenTime);
		}

		db.run(
			u.uq("friends", Object.keys(data), ["friendId"]),
			u.dollarize(_.assign({ friendId }, data)),
			dbCallback(callback)
		);
	};

	const removeFromFriends = function(friendId, callback) {
		db.run(
			u.dq("friends", ["friendId"]),
			u.dollarize({ friendId }),
			dbCallback(callback)
		);
	};

	const getServerId = function(name, callback) {
		db.get(
			u.sq("ircServers", ["serverId"], ["name"]),
			u.dollarize({ name }),
			dbCallback(callback)
		);
	};

	const getServerName = function(serverId, callback) {
		db.get(
			u.sq("ircServers", ["name"], ["serverId"]),
			u.dollarize({ serverId }),
			dbCallback(callback)
		);
	};

	const getChannelId = function(serverName, channelName, channelType, callback) {
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
							u.sq(
								"ircChannels",
								["channelId"],
								["serverId", "channelType", "name"]
							),
							u.dollarize({ channelType, name: channelName, serverId }),
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

	const getConfigValue = function(name, callback) {
		db.get(
			u.sq("config", ["value"], ["name"]),
			u.dollarize({ name }),
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

	const getAllConfigValues = function(callback) {
		db.all(
			u.sq("config", ["name", "value"]),
			dbCallback(function(err, rows) {
				if (err) {
					callback(err);
				}
				else {
					var obj = u.nameValueRowsToObject(rows);
					_.forOwn(obj, (value, key) => {
						obj[key] = JSON.parse(value);
					});
					callback(null, obj);
				}
			})
		);
	};

	const storeConfigValue = function(name, value, callback) {
		upsert(
			u.uq("config", ["value"], ["name"]),
			u.iq("config", ["name", "value"]),
			u.dollarize({ name, value: JSON.stringify(value) }),
			callback
		);
	};

	const getNicknames = function(callback) {
		const prepareNicknameListValue = function(list) {
			if (list) {
				return list.split("\n");
			}

			return list;
		};

		const prepareNicknameValues = function(err, data) {
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
			u.sq("nicknames", ["*"]) + " " + u.oq("nickname", ASC),
			prepareNicknameValues
		);
	};

	const getNicknameCount = function(callback) {
		db.get(
			u.sq("nicknames", ["COUNT(*) AS count"]),
			dbCallback(callback)
		);
	};

	const addNickname = function(nickname, callback) {
		db.run(
			u.iq("nicknames", ["nickname"]),
			u.dollarize({ nickname }),
			dbCallback(callback)
		);
	};

	const modifyNickname = function(nickname, data, callback) {
		const keys = Object.keys(data);

		keys.forEach((key) => {
			if (data[key] && data[key] instanceof Array) {
				data[key] = data[key].join("\n").toLowerCase() || null;
			}
		});

		db.run(
			u.uq("nicknames", keys, ["nickname"]),
			u.dollarize(_.assign({ nickname }, data)),
			dbCallback(callback)
		);
	};

	const removeNickname = function(nickname, callback) {
		db.run(
			u.dq("nicknames", ["nickname"]),
			u.dollarize({ nickname }),
			dbCallback(callback)
		);
	};

	const addServerToIrcConfig = function(data, callback) {
		upsert(
			u.uq(
				"ircServers",
				[
					"hostname", "port", "secure", "username",
					"password", "nickname", "isEnabled"
				],
				["name"]
			),
			u.iq(
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

	const modifyServerInIrcConfig = function(serverId, data, callback) {
		db.run(
			u.uq("ircServers", Object.keys(data), ["serverId"]),
			u.dollarize(_.assign({ serverId }, data)),
			dbCallback(callback)
		);
	};

	const removeServerFromIrcConfig = function(serverId, callback) {
		db.run(
			u.uq("ircServers", ["isEnabled"], ["serverId"]),
			u.dollarize({ isEnabled: 0, serverId }),
			dbCallback(callback)
		);
	};

	const addChannelToIrcConfig = function(serverId, name, channelType, data, callback) {
		data = data || {};
		let dataKeys = Object.keys(data);
		upsert(
			u.uq(
				"ircChannels",
				["isEnabled"].concat(dataKeys),
				["serverId", "channelType", "name"]
			),
			u.iq(
				"ircChannels",
				["serverId", "channelType", "name", "isEnabled"].concat(dataKeys)
			),
			u.dollarize(_.assign({ serverId, channelType, name, isEnabled: 1 }, data)),
			dbCallback(callback)
		);
	};

	const modifyChannelInIrcConfig = function(channelId, data, callback) {
		if (data.lastSeenTime) {
			data.lastSeenTime = u.getTimestamp(data.lastSeenTime);
		}

		if (data.channelConfig) {
			data.channelConfig = JSON.stringify(data.channelConfig);

			if (data.channelConfig === "{}") {
				data.channelConfig = null;
			}
		}

		db.run(
			u.uq("ircChannels", Object.keys(data), ["channelId"]),
			u.dollarize(_.assign({ channelId }, data)),
			dbCallback(callback)
		);
	};

	const removeChannelFromIrcConfig = function(channelId, callback) {
		db.run(
			u.uq("ircChannels", ["isEnabled"], ["channelId"]),
			u.dollarize({ isEnabled: 0, channelId }),
			dbCallback(callback)
		);
	};

	const getLastSeenChannels = function(callback) {
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

	const getLastSeenUsers = function(callback) {
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

	const getFriendsList = function(callback) {
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

	const getLines = function(where, direction, limit, args, callback) {
		db.all(
			u.sq(
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
			u.oq("lines.time", direction) + " " +
			"LIMIT " + limit,
			args,
			dbCallback(callback)
		);
	};

	const getDateLines = function(where, args, options, callback) {
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

	const getDateLinesForChannel = function(channelId, date, options, callback) {
		getDateLines(
			"WHERE lines.channelId = $channelId " +
			"AND lines.date = $date",
			u.dollarize({ channelId, date }),
			options,
			callback
		);
	};

	const getDateLinesForUsername = function(username, date, options, callback) {
		getDateLines(
			"WHERE lines.username = $username " +
			"AND lines.date = $date " +
			"AND " + excludeEventLinesQuery,
			u.dollarize({ username, date }),
			options,
			callback
		);
	};

	const getMostRecentLines = function(where, limit, args, beforeTime, callback) {
		args = args || {};
		let beforeTimeLine = "";

		if (beforeTime) {
			beforeTimeLine = (where ? " AND " : "WHERE ") +
				"lines.time < $beforeTime";
			args["$beforeTime"] = u.getTimestamp(beforeTime);
		}

		getLines(
			where + beforeTimeLine,
			DESC,
			limit,
			args,
			callback
		);
	};

	const getMostRecentChannelLines = function(channelId, limit, beforeTime, callback) {
		getMostRecentLines(
			"WHERE lines.channelId = $channelId",
			limit,
			u.dollarize({ channelId }),
			beforeTime,
			callback
		);
	};

	const getMostRecentUserLines = function(username, limit, beforeTime, callback) {
		// TODO: Somehow include connection event lines
		getMostRecentLines(
			"WHERE lines.username = $username " +
			"AND " + excludeEventLinesQuery,
			limit,
			u.dollarize({ username }),
			beforeTime,
			callback
		);
	};

	const getMostRecentAllFriendsLines = function(limit, beforeTime, callback) {
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

	const getMostRecentHighlightsLines = function(limit, beforeTime, callback) {
		// TODO: Somehow include connection event lines
		getMostRecentLines(
			"WHERE lines.isHighlight = 1",
			limit,
			{},
			beforeTime,
			callback
		);
	};

	const getSurroundingLines = function(
		channelId, lineTime, distanceMins, limit, callback
	) {
		let d = lineTime;

		if (typeof lineType !== "object") {
			d = new Date(lineTime);
		}

		let timeString = d.toISOString();

		let minTime = new Date(+d - distanceMins * 60000).toISOString();
		let maxTime = new Date(+d + distanceMins * 60000).toISOString();

		let before = (callback) => {
			getLines(
				"WHERE lines.channelId = $channelId " +
				"AND lines.time >= $minTime " +
				"AND lines.time <= $timeString",
				DESC,
				limit,
				u.dollarize({ channelId, minTime, timeString }),
				callback
			);
		};

		let after = (callback) => {
			getLines(
				"WHERE lines.channelId = $channelId " +
				"AND lines.time >= $timeString " +
				"AND lines.time <= $maxTime",
				ASC,
				limit,
				u.dollarize({ channelId, maxTime, timeString }),
				callback
			);
		};

		async.parallel({ before, after }, callback);
	};

	const getDateLineCountForChannel = function(channelId, date, callback) {
		db.get(
			u.sq("lines", ["COUNT(*) AS count"], ["channelId", "date"]),
			u.dollarize({ channelId, date }),
			dbCallback(callback)
		);
	};

	const getDateLineCountForUsername = function(username, date, callback) {
		// TODO: Exclude event lines, because they are not reliable in user logs
		db.get(
			u.sq("lines", ["COUNT(*) AS count"], ["username", "date"]),
			u.dollarize({ username, date }),
			dbCallback(callback)
		);
	};

	const prepareLine = function(line) {
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

		return {
			$lineId: line.lineId,
			$channelId: line.channelId,
			$type: line.type,
			$time: u.getTimestamp(line.time),
			$date: getLocalDatestampFromTime(line.time),
			$username: line.username,
			$message: line.message,
			$symbol: line.symbol,
			$tags: line.tags && JSON.stringify(line.tags),
			$eventData: eventData && JSON.stringify(eventData),
			$isHighlight: isHighlight
		};
	};

	const storeLines = function(lines, callback) {
		let amount = lines && lines.length;

		if (!amount) {
			return;
		}

		let flattenedValues = {};

		// TODO: Max amount of messages here

		lines.forEach((l, i) => {
			let line = prepareLine(l);
			Object.keys(line).forEach((k) => {
				flattenedValues[k + i] = line[k];
			});
		});

		db.run(
			u.miq("lines", [
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
			], amount),
			flattenedValues,
			dbCallback(callback)
		);
	};

	const deleteLinesWithLineIds = function(lineIds, callback) {
		db.run(
			"DELETE FROM lines WHERE lineId IN " + u.formatIn(lineIds),
			dbCallback(callback)
		);
	};

	const getLineByLineId = function(lineId, callback) {
		db.get(
			u.sq("lines", ["*"], ["lineId"]),
			u.dollarize({ lineId }),
			dbCallback(callback)
		);
	};

	const deleteLinesBeforeTime = function(time, callback) {
		time = u.getTimestamp(time);

		db.run(
			"DELETE FROM lines WHERE lines.time <= $time",
			u.dollarize({ time }),
			dbCallback(callback)
		);
	};

	const deleteLinesBeforeRetentionPoint = function(
		retainDbValue, retainDbType, callback
	) {
		if (retainDbValue <= 0) {
			return;
		}

		if (retainDbType === constants.RETAIN_DB_TYPES.LINES) {
			// Figure out the timestamp for the Nth line

			// Sane lower bound for amount of lines
			retainDbValue = Math.max(5000, retainDbValue);

			db.get(
				u.sq("lines", ["lines.time"]) + " " +
				u.oq("lines.time", DESC) +
				` LIMIT 1 OFFSET ${retainDbValue}`,
				{},
				dbCallback(function(err, data) {
					if (!err && data && data.time) {
						deleteLinesBeforeTime(data.time, callback);
					}
				})
			);
		}

		else if (retainDbType === constants.RETAIN_DB_TYPES.DAYS) {

			// Sane upper bound for amount of days
			if (retainDbValue < 15000) {
				let time = timeUtils.offsetDate(new Date(), -1 * retainDbValue).toISOString();

				if (time[0] !== "-") {
					// If not weird negative values
					deleteLinesBeforeTime(time, callback);
				}
			}
		}

		else {
			console.warn(`Weird retain db type: ${retainDbType}`);
		}
	};

	/*

	API:

	addChannelToIrcConfig(serverId, name, channelType, data, callback)
	addNickname(nickname, callback)
	addServerToIrcConfig(data, callback)
	addToFriends(serverId, username, isBestFriend, callback)
	close()
	deleteLinesBeforeRetentionPoint(retainDbValue, retainDbType, callback)
	deleteLinesBeforeTime(time, callback)
	deleteLinesWithLineIds(lineIds, callback)
	getAllConfigValues(callback)
	getChannelId(serverName, channelName, channelType, callback)
	getConfigValue(name, callback)
	getDateLineCountForChannel(channelId, date, callback)
	getDateLineCountForUsername(username, date, callback)
	getDateLinesForChannel(channelId, date, options, callback)
	getDateLinesForUsername(username, date, options, callback)
	getFriend(serverId, username, callback)
	getFriendCount(callback)
	getFriends(callback)
	getFriendsList(callback)
	getIrcChannel(channelId, callback)
	getIrcChannelCount(callback)
	getIrcChannels(callback)
	getIrcConfig(callback)
	getIrcServer(serverId, callback)
	getIrcServerCount(callback)
	getIrcServers(callback)
	getLastSeenChannels(callback)
	getLastSeenUsers(callback)
	getLineByLineId(lineId, callback)
	getMostRecentAllFriendsLines(limit, beforeTime, callback)
	getMostRecentChannelLines(channelId, limit, beforeTime, callback)
	getMostRecentHighlightsLines(limit, beforeTime, callback)
	getMostRecentUserLines(username, limit, beforeTime, callback)
	getNicknameCount(callback)
	getNicknames(callback)
	getServerId(name, callback)
	getServerName(serverId, callback)
	getSurroundingLines(channelId, lineTime, distanceMins, limit, callback)
	modifyChannelInIrcConfig(channelId, data, callback)
	modifyFriend(friendId, data, callback)
	modifyNickname(nickname, data, callback)
	modifyServerInIrcConfig(serverId, data, callback)
	removeChannelFromIrcConfig(channelId, callback)
	removeFromFriends(friendId, callback)
	removeNickname(nickname, callback)
	removeServerFromIrcConfig(serverId, callback)
	storeConfigValue(name, value, callback)
	storeLines(lines, callback)

	*/

	const output = {
		_db: db,
		addChannelToIrcConfig,
		addNickname,
		addServerToIrcConfig,
		addToFriends,
		close,
		deleteLinesBeforeRetentionPoint,
		deleteLinesBeforeTime,
		deleteLinesWithLineIds,
		getAllConfigValues,
		getChannelId,
		getConfigValue,
		getDateLineCountForChannel,
		getDateLineCountForUsername,
		getDateLinesForChannel,
		getDateLinesForUsername,
		getFriend,
		getFriendCount,
		getFriends,
		getFriendsList,
		getIrcChannel,
		getIrcChannelCount,
		getIrcChannels,
		getIrcConfig,
		getIrcServer,
		getIrcServerCount,
		getIrcServers,
		getLastSeenChannels,
		getLastSeenUsers,
		getLineByLineId,
		getMostRecentAllFriendsLines,
		getMostRecentChannelLines,
		getMostRecentHighlightsLines,
		getMostRecentUserLines,
		getNicknameCount,
		getNicknames,
		getServerId,
		getServerName,
		getSurroundingLines,
		modifyChannelInIrcConfig,
		modifyFriend,
		modifyNickname,
		modifyServerInIrcConfig,
		removeChannelFromIrcConfig,
		removeFromFriends,
		removeNickname,
		removeServerFromIrcConfig,
		storeConfigValue,
		storeLines
	};

	main.setDb(output);
};

module.exports = function() {
	return function(main, callback) {
		// Create database if needed
		createDatabaseFromEmpty((err) => {
			if (err) {
				throw err;
			}
			else {
				// Open database

				let dbFilename = pathUtils.getDatabaseFilename();
				let db = new sqlite.Database(dbFilename);

				initializeDb(db);
				mainMethods(main, db);

				if (typeof callback === "function") {
					callback();
				}
			}
		});
	};
};
