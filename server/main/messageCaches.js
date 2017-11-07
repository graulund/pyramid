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
	var systemCache = [];
	var channelIdCache = {};

	var currentBunchedMessage = {};
	var bunchableLinesToInsert = {};

	var lineIdsToDelete = new Set();
	var waitingLineInserts = [];

	// Util -------------------------------------------------------------------

	const withUuid = function(data) {
		return _.assign({}, data, { lineId: uuid.v4() });
	};

	const setChannelIdCache = function(cache) {
		channelIdCache = cache;
	};

	const getCacheLinesSetting = function() {
		const valueFromConfig = parseInt(appConfig.configValue("cacheLines"), 10);

		if (!isNaN(valueFromConfig) && valueFromConfig >= 20 && valueFromConfig <= 500) {
			return valueFromConfig;
		}

		return constants.CACHE_LINES;
	};

	// Storing and caching ----------------------------------------------------

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

	const _storeLine = function(channel, line) {
		if (channelIdCache[channel]) {
			line.channelId = channelIdCache[channel];
			waitingLineInserts.push(line);
		}
	};

	const storeLine = function(channel, line) {

		if (channelIdCache[channel]) {
			_storeLine(channel, line);
		}

		else {
			console.warn(`Channel ${channel} did not exist in channel id cache`);

			// Add to db and store
			addChannelToDb(channel, () => {
				_storeLine(channel, line);
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

	const cacheChannelEvent = function(channel, data, createBunch) {

		// Create a bunch if needed

		if (createBunch) {
			currentBunchedMessage[channel] = data;
		}

		// Add to db

		storeLine(channel, data);

		// Send to users

		if (io) {
			io.emitEventToChannel(channel, data);
		}
	};

	const cacheUserMessage = function(username, msg) {
		recipients.emitToUserRecipients(username, msg);
	};

	const cacheCategoryMessage = function(categoryName, msg) {

		if (categoryName === "system") {
			systemCache = cacheItem(systemCache, msg);
		}

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
		resetChannelBunch(channelUri);

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

	// Bunching ---------------------------------------------------------------

	const replaceLastCacheItem = function(channel, data) {

		// Replace in cache

		currentBunchedMessage[channel] = data;

		// Add to db, but remove old ids

		storeBunchableLine(channel, data);

		if (data.prevIds && data.prevIds.length) {
			deleteLinesWithLineIds(data.prevIds);
		}
	};

	const getBunchableItem = function(item) {
		// We assume they're all in the same server/channel
		// Not keeping reasons

		let i = _.pick(item, [
			"argument", "mode", "symbol",
			"time", "type", "username"
		]);

		// Avoid including symbol if it's empty (will be most cases)
		if (!i.symbol) {
			delete i.symbol;
		}

		return i;
	};

	const cacheBunchableChannelEvent = function(channel, data) {
		const lastItem = currentBunchedMessage[channel];

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
					events: [
						getBunchableItem(lastItem),
						getBunchableItem(data)
					],
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

				var events = lastItem.events.concat([getBunchableItem(data)]);
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

		// Otherwise, just a normal addition to the list
		cacheChannelEvent(channel, data, true);
	};

	const resetChannelBunch = function(channel) {
		if (currentBunchedMessage[channel]) {
			currentBunchedMessage[channel] = null;
			delete currentBunchedMessage[channel];
		}
	};

	// Schedules --------------------------------------------------------------

	// Storing lines

	const storeWaitingLines = function() {
		let lines = waitingLineInserts.splice(0, 80);
		db.storeLines(lines);
	};

	setInterval(storeWaitingLines, 1000);

	// Bunchable lines

	const storeBunchableLine = function(channel, data) {
		// Store them in a cache...
		if (data && data.lineId) {
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

	// Clean up old lines

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
			db.deleteLinesWithLineIds(a);
		}
	};

	setInterval(_scheduledLineDelete, 10000);

	// Line retention schedule

	const _scheduledLineRetentionCleanup = function() {
		db.deleteLinesBeforeRetentionPoint(
			appConfig.configValue("retainDbValue"),
			appConfig.configValue("retainDbType")
		);
	};

	setInterval(_scheduledLineRetentionCleanup, 60000);

	// Getters ----------------------------------------------------------------

	const returnDbCache = function(callback) {
		return function(err, cache) {
			if (cache) {
				cache.reverse();
			}
			callback(err, cache);
		};
	};

	const getChannelCache = function(channel, callback) {
		return logs.getMostRecentChannelLines(
			channel,
			constants.CACHE_LINES,
			0,
			returnDbCache(callback)
		);
	};

	const getUserCache = function(username, callback) {
		return logs.getMostRecentUserLines(
			username,
			constants.CACHE_LINES,
			0,
			returnDbCache(callback)
		);
	};

	const getCategoryCache = function(categoryName, callback) {
		var func;

		switch (categoryName) {
			case "allfriends":
				func = logs.getMostRecentAllFriendsLines;
				break;
			case "highlights":
				func = logs.getMostRecentHighlightsLines;
				break;
			case "system":
				callback(null, systemCache);
				return;
		}

		return func(
			constants.CACHE_LINES,
			0,
			returnDbCache(callback)
		);
	};

	return {
		cacheBunchableChannelEvent,
		cacheCategoryMessage,
		cacheChannelEvent,
		cacheMessage,
		cacheUserMessage,
		getCategoryCache,
		getChannelCache,
		getUserCache,
		setChannelIdCache,
		withUuid
	};
};
