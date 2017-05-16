const lodash = require("lodash");
const uuid   = require("uuid");

const constants = require("../constants");
const util   = require("../util");

module.exports = function(
	db,
	io,
	appConfig,
	recipients,
	unseenHighlights
) {

	var channelCaches = {};
	var userCaches = {};
	var categoryCaches = { highlights: [], allfriends: [], system: [] };

	var currentHighlightContexts = {};
	var bunchableLinesToInsert = {};

	var lineIdsToDelete = new Set();

	const storeLine = function(
		channelUri, line, callback = function(){},
		channelIdCache = {}
	) {
		if (channelIdCache[channelUri]) {
			db.storeLine(channelIdCache[channelUri], line, callback);
		}
	};

	const cacheItem = function(cache, data) {
		// Add it
		cache.push(data);

		// And make sure we only have the maximum amount
		if (cache.length > constants.CACHE_LINES) {
			if (cache.length === constants.CACHE_LINES + 1) {
				cache.shift();
			} else {
				cache = cache.slice(cache.length - constants.CACHE_LINES);
			}
		}
	};

	const cacheChannelEvent = function(channelUri, data) {

		// Add to local cache

		if (!channelCaches[channelUri]) {
			channelCaches[channelUri] = [];
		}
		cacheItem(channelCaches[channelUri], data);

		// Add to db

		if (appConfig.configValue("logLinesDb")) {
			storeLine(channelUri, data);
		}

		// Send to users

		if (io) {
			io.emitEventToChannel(channelUri, data.type, data);
		}
	};

	const cacheUserMessage = function(username, msg) {
		if (!userCaches[username]) {
			userCaches[username] = [];
		}
		cacheItem(userCaches[username], msg);
		recipients.emitToUserRecipients(username, msg);
	};

	const cacheCategoryMessage = function(categoryName, msg) {
		if (!categoryCaches[categoryName]) {
			categoryCaches[categoryName] = [];
		}
		/*if (!categoryRecipients[categoryName]) {
			categoryRecipients[categoryName] = [];
		}*/

		cacheItem(categoryCaches[categoryName], msg);
		recipients.emitToCategoryRecipients(categoryName, msg);

		if (categoryName === "highlights" && msg.lineId) {
			unseenHighlights.unseenHighlightIds().add(msg.lineId);
			createCurrentHighlightContext(msg.channel, msg);

			if (io) {
				io.emitNewHighlight(null, msg);
				io.emitUnseenHighlights();
			}
		}
	};


	const createCurrentHighlightContext = function(channelUri, highlightMsg) {
		if (!currentHighlightContexts[channelUri]) {
			currentHighlightContexts[channelUri] = [];
		}

		currentHighlightContexts[channelUri].push(highlightMsg);
	};

	const addToCurrentHighlightContext = function(channelUri, msg) {
		const highlights = currentHighlightContexts[channelUri];

		if (highlights && highlights.length) {
			const survivingHighlights = [];
			highlights.forEach((highlight) => {
				const list = highlight.contextMessages;
				list.push(msg);

				if (list.length < 2 * constants.CONTEXT_CACHE_LINES) {
					survivingHighlights.push(highlight);
				}

				// TODO: Should not survive if it's too old...
			});

			currentHighlightContexts[channelUri] = survivingHighlights;
			recipients.emitCategoryCacheToRecipients("highlights");
		}
	};

	const replaceLastCacheItem = function(channelUri, data) {

		// Replace in cache

		const cache = channelCaches[channelUri];
		if (cache && cache.length) {
			cache[cache.length-1] = data;
		}

		// Add to db, but remove old ids

		storeBunchableLine(channelUri, data);

		if (data.prevIds && data.prevIds.length) {
			deleteLinesWithLineIds(data.prevIds);
		}
	};

	const storeBunchableLine = function(channelUri, data) {
		// Store them in a cache...
		if (appConfig.configValue("logLinesDb") && data && data.lineId) {
			bunchableLinesToInsert[data.lineId] = { channelUri, data };
		}
	};

	const _scheduledBunchableStore = function() {
		lodash.forOwn(bunchableLinesToInsert, (line, key) => {
			if (line && line.channelUri && line.data) {
				storeLine(line.channelUri, line.data);
			}
			delete bunchableLinesToInsert[key];
		});
	};

	// ...And insert them all regularly
	setInterval(_scheduledBunchableStore, 10000);

	const cacheBunchableChannelEvent = function(channelUri, data) {
		const cache = channelCaches[channelUri];
		if (cache && cache.length) {
			const lastItem = cache[cache.length-1];
			if (lastItem) {

				const isJoin = util.isJoinEvent(data);
				const isPart = util.isPartEvent(data);

				var bunch;
				if (constants.BUNCHABLE_EVENT_TYPES.indexOf(lastItem.type) >= 0) {
					// Create bunch and insert in place

					const lastIsJoin = util.isJoinEvent(lastItem);
					const lastIsPart = util.isPartEvent(lastItem);

					bunch = {
						channel: lastItem.channel,
						channelName: lastItem.channelName,
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
						channelName: lastItem.channelName,
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
					replaceLastCacheItem(channelUri, bunch);

					if (io) {
						io.emitEventToChannel(channelUri, bunch.type, bunch);
					}
					return;
				}
			}
		}

		// Otherwise, just a normal addition to the list
		cacheChannelEvent(channelUri, data);
	};

	const cacheMessage = function(
		channelUri, channelName, serverName, username, symbol,
		time, type, message, tags, relationship, highlightStrings
	) {
		const msg = {
			channel: channelUri,
			channelName: channelName,
			color: util.getUserColorNumber(username),
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

		// Record context if highlight
		const isHighlight = highlightStrings && highlightStrings.length;
		var contextMessages = [], highlightMsg = null;

		if (isHighlight) {
			const currentCache = (channelCaches[channelUri] || []);
			// TODO: Maximum time since
			contextMessages = currentCache.slice(
				Math.max(0, currentCache.length - constants.CONTEXT_CACHE_LINES),
				currentCache.length
			);
			highlightMsg = lodash.clone(msg);
			highlightMsg.contextMessages = contextMessages;
		}

		// Store into cache
		cacheChannelEvent(channelUri, msg);
		addToCurrentHighlightContext(channelUri, msg);

		// Friends
		if (relationship >= constants.RELATIONSHIP_FRIEND) {
			cacheUserMessage(username, msg);
			cacheCategoryMessage("allfriends", msg);
		}

		// Highlights
		if (isHighlight) {
			cacheCategoryMessage("highlights", highlightMsg);
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
		return lodash.assign({}, data, { lineId: uuid.v4() });
	};

	return {
		cacheBunchableChannelEvent,
		cacheCategoryMessage,
		cacheChannelEvent,
		cacheMessage,
		cacheUserMessage,
		getCategoryCache: (categoryName) => categoryCaches[categoryName],
		getChannelCache: (channelUri) => channelCaches[channelUri],
		getUserCache: (username) => userCaches[username],
		withUuid
	};
};
