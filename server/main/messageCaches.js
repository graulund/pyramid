const _ = require("lodash");
const async = require("async");
const uuid = require("uuid");

const constants = require("../constants");
const eventUtils = require("../util/events");
const usernameUtils = require("../util/usernames");

module.exports = function(
	db,
	io,
	appConfig,
	ircConfig,
	logs,
	recipients,
	unseenHighlights,
	unseenConversations
) {

	var channelCaches = {};
	var userCaches = {};
	var categoryCaches = { highlights: [], allfriends: [], system: [] };
	var channelIdCache = {};

	var bunchableLinesToInsert = {};
	var prefilledSubjectNames = [];

	var lineIdsToDelete = new Set();

	const getCacheLinesSetting = function() {
		const valueFromConfig = parseInt(appConfig.configValue("cacheLines"), 10);

		if (!isNaN(valueFromConfig) && valueFromConfig >= 20 && valueFromConfig <= 500) {
			return valueFromConfig;
		}

		return constants.CACHE_LINES;
	};

	const addChannelToDb = function(channelUri, callback) {
		async.waterfall([
			(callback) => ircConfig.addChannelToIrcConfigFromUri(channelUri, callback),
			(data, callback) => ircConfig.loadIrcConfig(callback)
		], function(err) {
			if (!err) {
				setChannelIdCache(ircConfig.channelIdCache());
			}
			else {
				console.warn("addChannelToDb error:", err);
			}

			callback(err);
		});
	};

	const _storeLine = function(channel, line, callback) {
		if (channelIdCache[channel]) {
			db.storeLine(channelIdCache[channel], line, callback);
		}
	};

	const storeLine = function(
		channel, line, callback = function(){}
	) {

		if (channelIdCache[channel]) {
			_storeLine(channel, line, callback);
		}

		else {
			console.warn(`Channel ${channel} did not exist in channel id cache`);

			// Add to db and store
			addChannelToDb(channel, () => {
				_storeLine(channel, line, callback);
			});
		}
	};

	const cacheItem = function(cache, data) {
		const cacheLinesSetting = getCacheLinesSetting();

		// Add it
		cache.push(data);

		// And make sure we only have the maximum amount
		if (cache.length > cacheLinesSetting) {
			if (cache.length === cacheLinesSetting + 1) {
				cache.shift();
			} else {
				cache = cache.slice(cache.length - cacheLinesSetting);
			}
		}

		return cache;
	};

	const cacheChannelEvent = function(channel, data) {

		// Add to local cache

		if (!channelCaches[channel]) {
			channelCaches[channel] = [];
		}
		channelCaches[channel] = cacheItem(channelCaches[channel], data);

		// Add to db

		if (appConfig.configValue("logLinesDb")) {
			storeLine(channel, data);
		}

		// Send to users

		if (io) {
			io.emitEventToChannel(channel, data);
		}
	};

	const cacheUserMessage = function(username, msg) {
		if (!userCaches[username]) {
			userCaches[username] = [];
		}
		userCaches[username] = cacheItem(userCaches[username], msg);
		recipients.emitToUserRecipients(username, msg);
	};

	const cacheCategoryMessage = function(categoryName, msg) {
		if (!categoryCaches[categoryName]) {
			categoryCaches[categoryName] = [];
		}

		categoryCaches[categoryName] = cacheItem(categoryCaches[categoryName], msg);
		recipients.emitToCategoryRecipients(categoryName, msg);

		if (categoryName === "highlights" && msg.lineId) {
			unseenHighlights.addUnseenHighlightId(msg.lineId);

			if (io) {
				io.emitNewHighlight(null, msg);
				io.emitUnseenHighlights();
			}
		}
	};

	const reportUnseenPrivateMessage = function(serverName, user, msg) {
		let { displayName, username } = user;
		unseenConversations.addUnseenUser(serverName, username, displayName);

		if (io) {
			io.emitNewPrivateMessage(null, msg);
		}
	};

	const replaceLastCacheItem = function(channel, data) {

		// Replace in cache

		const cache = channelCaches[channel];
		if (cache && cache.length) {
			cache[cache.length-1] = data;
		}

		// Add to db, but remove old ids

		storeBunchableLine(channel, data);

		if (data.prevIds && data.prevIds.length) {
			deleteLinesWithLineIds(data.prevIds);
		}
	};

	const storeBunchableLine = function(channel, data) {
		// Store them in a cache...
		if (appConfig.configValue("logLinesDb") && data && data.lineId) {
			bunchableLinesToInsert[data.lineId] = { channel, data };
		}
	};

	const _scheduledBunchableStore = function() {
		_.forOwn(bunchableLinesToInsert, (line, key) => {
			if (line && line.channel && line.data) {
				storeLine(line.channel, line.data);
			}
			delete bunchableLinesToInsert[key];
		});
	};

	// ...And insert them all regularly
	setInterval(_scheduledBunchableStore, 10000);

	const cacheBunchableChannelEvent = function(channel, data) {
		const cache = channelCaches[channel];
		if (cache && cache.length) {
			const lastItem = cache[cache.length-1];
			if (lastItem) {

				const isJoin = eventUtils.isJoinEvent(data);
				const isPart = eventUtils.isPartEvent(data);

				var bunch;
				if (constants.BUNCHABLE_EVENT_TYPES.indexOf(lastItem.type) >= 0) {
					// Create bunch and insert in place

					const lastIsJoin = eventUtils.isJoinEvent(lastItem);
					const lastIsPart = eventUtils.isPartEvent(lastItem);

					bunch = {
						channel: lastItem.channel,
						events: [lastItem, data],
						firstTime: lastItem.time,
						joinCount: isJoin + lastIsJoin,
						lineId: uuid.v4(),
						partCount: isPart + lastIsPart,
						prevIds: [lastItem.lineId],
						server: lastItem.server,
						time: data.time,
						type: "events"
					};
				}
				else if (lastItem.type === "events") {
					// Add to bunch, resulting in a new, inserted in place
					let maxLines = constants.BUNCHED_EVENT_SIZE;

					var prevIds = lastItem.prevIds.concat([lastItem.lineId]);
					if (prevIds.length > maxLines) {
						prevIds = prevIds.slice(prevIds.length - maxLines);
					}

					var events = lastItem.events.concat([data]);
					if (events.length > maxLines) {
						events = events.slice(events.length - maxLines);
					}

					bunch = {
						channel: lastItem.channel,
						events,
						firstTime: lastItem.firstTime,
						joinCount: lastItem.joinCount + isJoin,
						lineId: uuid.v4(),
						partCount: lastItem.partCount + isPart,
						prevIds,
						server: lastItem.server,
						time: data.time,
						type: "events"
					};
				}
				if (bunch) {
					replaceLastCacheItem(channel, bunch);

					if (io) {
						io.emitEventToChannel(channel, bunch);
					}
					return;
				}
			}
		}

		// Otherwise, just a normal addition to the list
		cacheChannelEvent(channel, data);
	};

	const cacheMessage = function(
		channelUri, serverName, username, symbol,
		time, type, message, tags, relationship, highlightStrings,
		privateMessageHighlightUser, messageToken, customCols
	) {
		let msg = {
			channel: channelUri,
			color: usernameUtils.getUserColorNumber(username),
			highlight: highlightStrings,
			lineId: uuid.v4(),
			message,
			relationship,
			server: serverName,
			symbol,
			tags,
			time,
			type,
			username
		};

		if (messageToken) {
			msg.messageToken = messageToken;
		}

		if (customCols) {
			msg = _.assign(msg, customCols);
		}

		// Record context if highlight
		let isHighlight = highlightStrings && highlightStrings.length;

		// Store into cache
		cacheChannelEvent(channelUri, msg);

		// Friends
		if (relationship >= constants.RELATIONSHIP_FRIEND) {
			cacheUserMessage(username, msg);
			cacheCategoryMessage("allfriends", msg);
		}

		// Highlights
		if (isHighlight) {
			cacheCategoryMessage("highlights", msg);
		}

		// Private messages
		if (privateMessageHighlightUser) {
			reportUnseenPrivateMessage(
				serverName, privateMessageHighlightUser, msg
			);
		}
	};

	const deleteLinesWithLineIds = function(lineIds) {
		lineIds.forEach((lineId) => {
			// Store them
			lineIdsToDelete.add(lineId);
			// Remove it immediately from insert cache...
			delete bunchableLinesToInsert[lineId];
		});
	};

	// ...And combine and delete all at an interval
	const _scheduledLineDelete = function() {
		if (lineIdsToDelete && lineIdsToDelete.size) {
			const a = Array.from(lineIdsToDelete);
			lineIdsToDelete.clear();
			db.deleteLinesWithLineIds(a, function(){});
		}
	};

	setInterval(_scheduledLineDelete, 10000);

	const withUuid = function(data) {
		return _.assign({}, data, { lineId: uuid.v4() });
	};

	const setChannelIdCache = function(cache) {
		channelIdCache = cache;
	};

	const prefillCache = function(
		subjectName, getCacheCallback, requestCallback, storeCacheCallback, callback
	) {

		if (prefilledSubjectNames.indexOf(subjectName) >= 0) {
			callback(new Error("Already prefilled"));
			return;
		}

		let cache = getCacheCallback();
		let cacheLength = cache && cache.length || 0;
		let requestLength = getCacheLinesSetting() - cacheLength;
		let beforeTime = null;

		if (requestLength < 10) {
			callback(new Error("Already full"));
			return;
		}

		if (cache && cache[0]) {
			beforeTime = cache[0].time;
		}

		requestCallback(requestLength, beforeTime, function(err, file) {
			if (!err) {
				// Get existing data
				let cache = getCacheCallback() || [];
				let missingLength = getCacheLinesSetting() - cache.length;

				if (!file || !file.length) {
					callback(new Error("No data"));
					return;
				}

				// Slice, and flip list to ascending time sort
				let fileSlice = file.slice(0, missingLength);
				fileSlice.reverse();

				// Mark as prefilled
				fileSlice.map((line) => {
					if (line) {
						line.prefilled = true;
					}
					return line;
				});

				// Insert in the beginning
				storeCacheCallback(fileSlice.concat(cache));

				// Record as prefilled
				prefilledSubjectNames.push(subjectName);
			}

			callback(err);
		});
	};

	const prefillChannelCache = function(channel, callback) {
		prefillCache(
			`channel:${channel}`,
			() => channelCaches[channel],
			(requestLength, beforeTime, callback) => {
				logs.getMostRecentChannelLines(
					channel,
					requestLength,
					beforeTime,
					callback
				);
			},
			(data) => { channelCaches[channel] = data; },
			callback
		);
	};

	const prefillUserCache = function(username, callback) {
		prefillCache(
			`user:${username}`,
			() => userCaches[username],
			(requestLength, beforeTime, callback) => {
				logs.getMostRecentUserLines(
					username,
					requestLength,
					beforeTime,
					callback
				);
			},
			(data) => { userCaches[username] = data; },
			callback
		);
	};

	const prefillCategoryCache = function(categoryName, callback) {
		var func;

		switch (categoryName) {
			case "allfriends":
				func = logs.getMostRecentAllFriendsLines;
				break;
			case "highlights":
				func = logs.getMostRecentHighlightsLines;
				break;
		}

		if (!func) {
			callback(new Error("Not a prefillable category"));
			return;
		}

		prefillCache(
			`category:${categoryName}`,
			() => categoryCaches[categoryName],
			func,
			(data) => { categoryCaches[categoryName] = data; },
			callback
		);
	};

	return {
		cacheBunchableChannelEvent,
		cacheCategoryMessage,
		cacheChannelEvent,
		cacheMessage,
		cacheUserMessage,
		prefillCategoryCache,
		prefillChannelCache,
		prefillUserCache,
		getCategoryCache: (categoryName) => categoryCaches[categoryName],
		getChannelCache: (channel) => channelCaches[channel],
		getUserCache: (username) => userCaches[username],
		setChannelIdCache,
		withUuid
	};
};
