// PYRAMID
// Main data logic

const async  = require("async");
const lodash = require("lodash");
const long   = require("long");
const moment = require("moment-timezone");
const uuid   = require("uuid");

const constants = require("./constants");
const configDefaults = require("./defaults");
const log = require("./log");
const util = require("./util");

// Application state

var currentAppConfig = {};
var currentIrcConfig = [];
var currentNicknames = [];
var currentFriendsList = [];

var lastSeenChannels = {};
var lastSeenUsers = {};

var channelUserLists = {};
var currentOnlineFriends = [];

var channelCaches = {};
var userCaches = {};
var categoryCaches = { highlights: [], allfriends: [], system: [] };
var currentHighlightContexts = {};

var channelRecipients = {};
var userRecipients = {};
var categoryRecipients = { highlights: [], allfriends: [], system: [] };

var cachedLastSeens = {};

var unseenHighlightIds = new Set();

var currentViewState = {};
var currentIrcConnectionState = {};

// (name/uri => id caches)

var channelIdCache = {};
var serverIdCache = {};
var friendIdCache = {};

var bunchableLinesToInsert = {};
var lineIdsToDelete = new Set();

var configValueChangeHandlers = {};

var displayNameCache = {};

// Delayed singletons

var db, io, irc, plugins, web;

var dbCallback, ioCallback, ircCallback, pluginsCallback, webCallback;

const setDb = function(_db) {
	db = _db;

	if (typeof dbCallback === "function") {
		dbCallback(null, db);
	}
};

const setIo = function(_io) {
	io = _io;

	if (typeof ioCallback === "function") {
		ioCallback(null, io);
	}
};

const setIrc = function(_irc) {
	irc = _irc;

	if (typeof ircCallback === "function") {
		ircCallback(null, irc);
	}
};

const setPlugins = function(_plugins) {
	plugins = _plugins;

	if (typeof pluginsCallback === "function") {
		pluginsCallback(null, plugins);
	}
};

const setWeb = function(_web) {
	web = _web;

	if (typeof webCallback === "function") {
		webCallback(null, web);
	}
};

const onDb = function(callback) {
	if (db) {
		callback(null, db);
	}
	else {
		dbCallback = callback;
	}
};

const onIo = function(callback) {
	if (io) {
		callback(null, io);
	}
	else {
		ioCallback = callback;
	}
};

const onIrc = function(callback) {
	if (irc) {
		callback(null, irc);
	}
	else {
		ircCallback = callback;
	}
};

const onPlugins = function(callback) {
	if (plugins) {
		callback(null, plugins);
	}
	else {
		pluginsCallback = callback;
	}
};

const onWeb = function(callback) {
	if (web) {
		callback(null, web);
	}
	else {
		webCallback = callback;
	}
};

// Utility that requires state

const localMoment = function(arg) {
	return moment(arg).tz(configValue("timeZone"));
};

const _log = function(message, level = "info", time = null) {
	handleSystemLog(null, message, level, time);
};

const _warn = function(message, time = null) {
	_log(message, "warning", time);
};

// Last seen

const setLastSeenChannel = function(channel, data) {
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
					lastSeenDisplayName: data.displayName
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

const setLastSeenUser = function(username, data) {
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
	channel, username, time, relationship, displayName
) {
	setLastSeenChannel(
		channel,
		{ username, time, displayName }
	);

	if (relationship >= constants.RELATIONSHIP_FRIEND) {
		setLastSeenUser(
			username,
			{ channel, time, displayName }
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

// Chat code

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

	if (configValue("logLinesDb")) {
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

	if (io) {
		io.emitMessageToRecipients(userRecipients[username], msg);
	}
};

const cacheCategoryMessage = function(categoryName, msg) {
	if (!categoryCaches[categoryName]) {
		categoryCaches[categoryName] = [];
	}
	if (!categoryRecipients[categoryName]) {
		categoryRecipients[categoryName] = [];
	}

	cacheItem(categoryCaches[categoryName], msg);

	if (io) {
		io.emitMessageToRecipients(categoryRecipients[categoryName], msg);
	}

	if (categoryName === "highlights" && msg.lineId) {
		unseenHighlightIds.add(msg.lineId);
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

		if (io) {
			io.emitCategoryCacheToRecipients(
				categoryRecipients.highlights, "highlights"
			);
		}
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
	if (configValue("logLinesDb") && data && data.lineId) {
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
		color: getUserColorNumber(username),
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

const setChannelUserList = function(channelUri, userList) {
	if (channelUri) {
		channelUserLists[channelUri] = userList || {};
		reloadOnlineFriends();
	}
};

const getUserCurrentSymbol = function(channelUri, userName) {
	if (channelUri && channelUserLists[channelUri]) {
		return channelUserLists[channelUri][userName] || "";
	}

	return "";
};

const reloadOnlineFriends = function() {
	const onlines = new Set();

	lodash.forOwn(channelUserLists, (list) => {
		// TODO: Vary friends by server at some point
		if (list) {
			const names = Object.keys(list);
			names.forEach((name) => {
				const relationship = util.getRelationship(name, currentFriendsList);
				if (relationship >= constants.RELATIONSHIP_FRIEND) {
					onlines.add(name.toLowerCase());
				}
			});
		}
	});

	const list = Array.from(onlines).sort();

	// Only apply if something changed

	if (
		list.length !== currentOnlineFriends.length ||
		!list.every((name, i) => name === currentOnlineFriends[i])
	) {
		currentOnlineFriends = list;

		if (io) {
			io.emitOnlineFriends();
		}
	}
};

const getUserColorNumber = function(username) {
	if (username) {
		username = username.toLowerCase();

		var hashedValue = new long(0);

		for (var i = 0; i < username.length; i++) {
			var c = username.charCodeAt(i);
			hashedValue = hashedValue.shiftLeft(6).add(hashedValue).add(c);
		}

		return hashedValue.mod(30).toNumber();
	}

	return null;
};

const getHighlightStringsForMessage = function(message, channelUri, meUsername) {
	var highlightStrings = [];

	const meRegex = new RegExp("\\b" + meUsername + "\\b", "i");
	if (meRegex.test(message)) {
		highlightStrings.push(meUsername);
	}

	currentNicknames.forEach((nickname) => {
		const nickRegex = new RegExp("\\b" + nickname.nickname + "\\b", "i");
		if (
			nickRegex.test(message) &&
			util.passesChannelWhiteBlacklist(nickname, channelUri)
		) {
			highlightStrings.push(nickname.nickname);
		}
	});

	return highlightStrings;
};

const handleIncomingMessage = function(
	channelUri, channelName, serverName, username,
	time, type, message, tags, meUsername
) {
	const symbol = getUserCurrentSymbol(channelUri, username);
	const line = log.lineFormats[type].build(symbol, username, message);

	// Log

	if (configValue("logLinesFile")) {
		log.logChannelLine(channelUri, channelName, line, time);
	}
	else if (configValue("debug")) {
		console.log(`[${channelName}] ${line}`);
	}

	// Is this from a person among our friends? Note down "last seen" time.

	const relationship = util.getRelationship(username, currentFriendsList);

	if (relationship >= constants.RELATIONSHIP_FRIEND && configValue("logLinesFile")) {
		// Add to specific logs
		log.logCategoryLine(username.toLowerCase(), channelUri, channelName, line, time);
	}

	// Highlighted? Add to specific logs

	var highlightStrings = [];
	if (!username || username.toLowerCase() !== meUsername.toLowerCase()) {
		highlightStrings = getHighlightStringsForMessage(
			message, channelUri, meUsername
		);

		if (highlightStrings.length) {
			if (configValue("logLinesFile")) {
				log.logCategoryLine("mentions", channelUri, channelName, line, time);
			}
		}
	}

	// Display name

	const displayName = tags && tags["display-name"];

	if (serverName && username && displayName) {
		if (!(serverName in displayNameCache)) {
			displayNameCache[serverName] = {};
		}
		displayNameCache[serverName][username] = displayName;
	}

	// Store!

	updateLastSeen(
		channelUri, username, time, relationship, displayName
	);
	cacheMessage(
		channelUri, channelName, serverName, username, symbol,
		time, type, message, tags, relationship, highlightStrings
	);
};

const handleIncomingEvent = function(
	channelUri, channelName, serverName, type, data, time,
	channelUserList
) {

	if (data && data.username) {
		data.symbol = getUserCurrentSymbol(channelUri, data.username);
	}

	// Log

	const line = log.getLogLineFromData(type, data);

	if (line && configValue("logLinesFile")) {
		log.logChannelLine(channelUri, channelName, line, time);
	}

	// Channel user lists

	if (
		constants.USER_MODIFYING_EVENT_TYPES.indexOf(type) >= 0 &&
		data &&
		data.username
	) {
		channelUserLists[channelUri] = channelUserList;

		// Due to a fault in the node-irc API, they don't always remove this
		// until after the call, so let's just do this now...

		if (
			constants.PART_EVENT_TYPES.indexOf(type) >= 0 &&
			channelUserLists[channelUri]
		) {
			delete channelUserLists[channelUri][data.username];
		}

		if (io) {
			io.emitChannelUserListToRecipients(channelUri);
		}

		reloadOnlineFriends();
	}

	// Display name

	const extraData = {};

	if (
		serverName &&
		data &&
		data.username &&
		displayNameCache[serverName] &&
		displayNameCache[serverName][data.username]
	) {
		extraData.displayName = displayNameCache[serverName][data.username];
	}

	// Meta data

	const metadata = {
		channel: channelUri,
		channelName,
		lineId: uuid.v4(),
		relationship: data && data.username && util.getRelationship(data.username, currentFriendsList),
		server: serverName,
		time: time || new Date(),
		type
	};

	const event = lodash.assign(metadata, data, extraData);

	if (constants.BUNCHABLE_EVENT_TYPES.indexOf(type) >= 0) {
		cacheBunchableChannelEvent(channelUri, event);
	} else {
		cacheChannelEvent(channelUri, event);
	}
};

const handleSystemLog = function(serverName, message, level = "info", time = null) {
	if (level === "warn") {
		level = "warning";
	}

	if (configValue("debug") || level === "warning" || level === "error") {
		let loggedMessage = serverName
			? `[${serverName}] ${message}`
			: message;

		if (level === "error") {
			console.error(loggedMessage);
		}
		else if (level === "warning") {
			console.warn(loggedMessage);
		}
		else {
			console.log(loggedMessage);
		}
	}

	const data = {
		level,
		lineId: uuid.v4(),
		message,
		server: serverName,
		time: time || new Date(),
		type: "log"
	};

	cacheCategoryMessage("system", data);
};

const handleIrcConnectionStateChange = function(serverName, status) {

	const time = new Date();

	if (
		currentIrcConnectionState[serverName] &&
		currentIrcConnectionState[serverName].status === status
	) {
		// Ignore if status is already the given one
		return;
	}

	var info = null;

	if (currentIrcConfig.find((config) => config.name === serverName)) {
		// Update status
		info = { status, time };
		currentIrcConnectionState[serverName] = info;
	}
	else {
		// No longer in config
		delete currentIrcConnectionState[serverName];
	}

	if (io) {
		io.emitIrcConnectionStatus(serverName, info);
	}

	// Propagate message to all channels in this server
	const channelList = getConfigChannelsInServer(serverName);
	if (channelList && channelList.length) {
		channelList.forEach((channel) => {
			let channelName = util.channelNameFromUrl(channel, "#");
			let type = "connectionEvent";
			let data = { server: serverName, status };
			handleIncomingEvent(
				channel, channelName, serverName, type, data, time
			);
		});
	}
};

// Recipients of messages

const addRecipient = function(list, targetName, socket) {
	if (!list[targetName]) {
		list[targetName] = [];
	}
	if (list[targetName].indexOf(socket) < 0) {
		list[targetName].push(socket);
	}
};

const removeRecipient = function(list, targetName, socket) {
	if (list[targetName] && list[targetName].indexOf(socket) >= 0){
		lodash.remove(list[targetName], (r) => r === socket);
	}
};

const addChannelRecipient = function(channelUri, socket) {
	addRecipient(channelRecipients, channelUri, socket);
};

const removeChannelRecipient = function(channelUri, socket) {
	removeRecipient(channelRecipients, channelUri, socket);
};

const addUserRecipient = function(username, socket) {
	addRecipient(userRecipients, username, socket);
};

const removeUserRecipient = function(username, socket) {
	removeRecipient(userRecipients, username, socket);
};

const addCategoryRecipient = function(categoryName, socket) {
	if (constants.SUPPORTED_CATEGORY_NAMES.indexOf(categoryName) >= 0) {
		addRecipient(categoryRecipients, categoryName, socket);
	}
};

const removeCategoryRecipient = function(categoryName, socket) {
	if (constants.SUPPORTED_CATEGORY_NAMES.indexOf(categoryName) >= 0) {
		removeRecipient(categoryRecipients, categoryName, socket);
	}
};

const removeRecipientEverywhere = function(socket) {
	lodash.forOwn(channelRecipients, (list, channelUri) => {
		removeChannelRecipient(channelUri, socket);
	});
	lodash.forOwn(userRecipients, (list, username) => {
		removeUserRecipient(username, socket);
	});
	lodash.forOwn(categoryRecipients, (list, categoryName) => {
		removeCategoryRecipient(categoryName, socket);
	});
};

// See an unseen highlight

const reportHighlightAsSeen = function(messageId) {
	if (messageId) {
		unseenHighlightIds.delete(messageId);

		if (io) {
			io.emitUnseenHighlights();
		}
	}
};

const clearUnseenHighlights = function() {
	unseenHighlightIds.clear();

	if (io) {
		io.emitUnseenHighlights();
	}
};

const sendOutgoingMessage = function(channelUri, message, isAction = false) {
	irc.sendOutgoingMessage(channelUri, message, isAction);
};

const storeViewState = function(viewState) {
	currentViewState = lodash.assign({}, currentViewState, viewState);
};

// Load configuration

const getIrcConfig = function(callback) {
	db.getIrcConfig(callback);
};

const getConfigValue = function(name, callback) {
	db.getConfigValue(name, callback);
};

const getAllConfigValues = function(callback) {
	db.getAllConfigValues(callback);
};

const getNicknames = function(callback) {
	db.getNicknames(callback);
};

const getFriends = function(callback) {
	db.getFriends(callback);
};

const getFriendsList = function(callback) {
	db.getFriendsList(callback);
};

const getLastSeenChannels = function(callback) {
	db.getLastSeenChannels(callback);
};

const getLastSeenUsers = function(callback) {
	db.getLastSeenUsers(callback);
};

const storeLine = function(channelUri, line, callback = function(){}) {
	if (channelIdCache[channelUri]) {
		db.storeLine(channelIdCache[channelUri], line, callback);
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

const loadIrcConfig = function(callback) {
	getIrcConfig((err, data) => {
		if (err) {
			if (typeof callback === "function") {
				callback(err);
			}
		}
		else {
			currentIrcConfig = data;
			generateIrcConfigCaches();
			if (typeof callback === "function") {
				callback(null, data);
			}
		}
	});
};

const loadAppConfig = function(callback) {
	getAllConfigValues((err, data) => {
		if (err) {
			if (typeof callback === "function") {
				callback(err);
			}
		}
		else {
			currentAppConfig = data;
			if (typeof callback === "function") {
				callback(null, data);
			}
		}
	});
};

const loadNicknames = function(callback) {
	getNicknames((err, data) => {
		if (err) {
			if (typeof callback === "function") {
				callback(err);
			}
		}
		else {
			currentNicknames = data;
			if (typeof callback === "function") {
				callback(null, data);
			}
		}
	});
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

const generateIrcConfigCaches = function(config = currentIrcConfig) {
	var serverIds = {}, channelIds = {};

	if (config && config.length) {
		config.forEach((server) => {
			if (server && server.serverId && server.name) {
				serverIds[server.name] = server.serverId;

				if (server.channels && server.channels.length) {
					server.channels.forEach((channel) => {
						if (channel && channel.channelId && channel.name) {
							const channelUri = util.getChannelUri(channel.name, server.name);
							channelIds[channelUri] = channel.channelId;
						}
					});
				}
			}
		});
		serverIdCache = serverIds;
		channelIdCache = channelIds;
	}
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

const safeAppConfig = function(appConfig = currentAppConfig) {
	var outConfig = lodash.omit(appConfig, ["webPassword"]);

	if (appConfig.webPassword) {
		// Signal that a password has been set
		outConfig.webPassword = true;
	}

	return outConfig;
};

const safeIrcConfigDict = function(ircConfig = currentIrcConfig) {
	var ircConfigDict = {};
	ircConfig.forEach((config) => {
		var outConfig = lodash.omit(config, ["password"]);

		if (config.password) {
			// Signal that a password has been set
			outConfig.password = true;
		}

		if (outConfig.channels) {
			outConfig.channels = outConfig.channels.map(
				(val) => val.name
			);
		}

		ircConfigDict[config.name] = outConfig;
	});

	return ircConfigDict;
};

const getIrcConfigByName = function(name, ircConfig = currentIrcConfig) {
	for (var i = 0; i < ircConfig.length; i++) {
		if (ircConfig[i].name === name) {
			return ircConfig[i];
		}
	}

	return null;
};

const getConfigChannelsInServer = function(serverName, ircConfig = currentIrcConfig) {
	const s = getIrcConfigByName(serverName);
	if (s) {
		return s.channels.map((val) => util.getChannelUri(val.name, serverName));
	}

	return [];
};

const nicknamesDict = function(nicknames = currentNicknames) {
	const out = {};
	nicknames.forEach((nickname) => {
		out[nickname.nickname] = nickname;
	});

	return out;
};

const configValue = function(name) {

	if (typeof currentAppConfig[name] !== "undefined") {
		return currentAppConfig[name];
	}

	return configDefaults[name];
};

// Storing settings

const addServerToIrcConfig = function(data, callback) {

	if (data && data.name && data.name.charAt(0) === "_") {
		// Not allowed to start a server name with "_"
		callback(new Error("Not allowed to start a server name with an underscore"));
		return;
	}

	db.addServerToIrcConfig(data, callback);
};

const addToFriends = function(serverId, username, isBestFriend, callback) {
	db.addToFriends(serverId, username, isBestFriend, callback);
};

const storeConfigValue = function(name, value, callback) {

	if (name === "webPassword" && !value) {
		// Do not allow the setting of an empty web password
		callback(new Error("Empty web password"));
		return;
	}

	db.storeConfigValue(
		name,
		value,
		(err) => {
			if (err) {
				if (typeof callback === "function") {
					callback(err);
				}
			}
			else {
				// Handle new value
				const handlers = configValueChangeHandlers[name];
				if (handlers && handlers.length) {
					loadAppConfig(() => {
						handlers.forEach((handler) => {
							handler(value, name);
						});
					});
				}

				if (typeof callback === "function") {
					callback(null);
				}
			}
		}
	);
};

const addNickname = function(nickname, callback) {
	db.addNickname(nickname, callback);
};

const modifyNickname = function(nickname, data, callback) {
	db.modifyNickname(nickname, data, callback);
};

const removeNickname = function(nickname, callback) {
	db.removeNickname(nickname, callback);
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

const modifyServerInIrcConfig = function(serverName, details, callback) {
	async.waterfall([
		(callback) => db.getServerId(serverName, callback),
		(data, callback) => db.modifyServerInIrcConfig(data.serverId, details, callback)
	], callback);
};

const removeServerFromIrcConfig = function(serverName, callback) {
	async.waterfall([
		(callback) => db.getServerId(serverName, callback),
		(data, callback) => db.removeServerFromIrcConfig(data.serverId, callback)
	], callback);
};

const addChannelToIrcConfig = function(serverName, name, callback) {
	name = name.replace(/^#/, "");
	async.waterfall([
		(callback) => db.getServerId(serverName, callback),
		(data, callback) => db.addChannelToIrcConfig(data.serverId, name, callback)
	], callback);
};

const removeChannelFromIrcConfig = function(serverName, name, callback) {
	name = name.replace(/^#/, "");
	async.waterfall([
		(callback) => db.getChannelId(serverName, name, callback),
		(data, callback) => db.removeChannelFromIrcConfig(data.channelId, callback)
	], callback);
};

const addConfigValueChangeHandler = function(name, handler) {
	var names;

	if (!(name instanceof Array)) {
		names = [name];
	}
	else {
		names = name;
	}

	names.forEach((n) => {
		if (!configValueChangeHandlers[n]) {
			configValueChangeHandlers[n] = [];
		}

		configValueChangeHandlers[n].push(handler);
	});
};

// Storing lines

const parseDbLine = function(line, callback) {
	var l = null;
	if (line) {
		l = lodash.clone(line);

		// Channel and server names

		if (l.channelName && l.serverName) {
			l.channel = util.getChannelUri(l.channelName, l.serverName);
		}

		if (l.channelName) {
			l.channelName = "#" + l.channelName;
		}

		if (l.serverName) {
			l.server = l.serverName;
			delete l.serverName;
		}

		// Color

		if (l.username) {
			l.color = getUserColorNumber(l.username);
		}

		// Highlights

		var highlight = [];

		if (l.server) {
			const config = getIrcConfigByName(l.server);

			if (
				config && config.username && l.username &&
				config.username.toLowerCase() !== l.username.toLowerCase()
			) {
				highlight = getHighlightStringsForMessage(
					l.message, l.channel, config.username
				);
			}
		}

		l.highlight = highlight;

		// Tags

		if (typeof l.tags === "string") {
			try {
				l.tags = JSON.parse(l.tags);
			} catch(e) {}
		}

		// Event data

		if (typeof l.eventData === "string") {
			try {
				l.eventData = JSON.parse(l.eventData);

				if (l.eventData) {
					l.events  = l.eventData.events;
					l.prevIds = l.eventData.prevIds;
				}

			} catch(e) {}
		}

		delete l.channelId;
		delete l.eventData;
	}

	if (typeof callback === "function") {
		callback(null, l);
	}

	return l;
};

const parseDbLines = function(lines, callback) {
	const outLines = [];

	lines.forEach((line) => {
		if (line) {
			const l = parseDbLine(line);
			outLines.push(l);
		}
	});

	if (typeof callback === "function") {
		callback(null, outLines);
	}

	return outLines;
};

const getDateLineCountForChannel = function(channelUri, date, callback) {
	const serverName = util.channelServerNameFromUrl(channelUri);
	const channelName = util.channelNameFromUrl(channelUri);

	async.waterfall([
		(callback) => db.getChannelId(serverName, channelName, callback),
		(data, callback) => db.getDateLineCountForChannel(data.channelId, date, callback)
	], callback);
};

const getDateLinesForChannel = function(channelUri, date, options, callback) {
	const serverName = util.channelServerNameFromUrl(channelUri);
	const channelName = util.channelNameFromUrl(channelUri);

	async.waterfall([
		(callback) => db.getChannelId(serverName, channelName, callback),
		(data, callback) => db.getDateLinesForChannel(data.channelId, date, options, callback),
		(lines, callback) => parseDbLines(lines, callback)
	], callback);
};

const getDateLineCountForUsername = function(username, date, callback) {
	db.getDateLineCountForUsername(username, date, callback);
};

const getDateLinesForUsername = function(username, date, options, callback) {
	async.waterfall([
		(callback) => db.getDateLinesForUsername(username, date, options, callback),
		(lines, callback) => parseDbLines(lines, callback)
	], callback);
};

const getLineByLineId = function(lineId, callback) {
	async.waterfall([
		(callback) => db.getLineByLineId(lineId, callback),
		(line, callback) => parseDbLine(line, callback)
	], callback);
};

const getChannelLogDetails = function(channelUri, date, callback) {
	const today = util.ymd(localMoment());
	const yesterday = util.ymd(localMoment().subtract(1, "day"));

	const calls = [
		(callback) => getDateLineCountForChannel(channelUri, today, callback),
		(callback) => getDateLineCountForChannel(channelUri, yesterday, callback)
	];

	if (date && date !== today && date !== yesterday) {
		calls.push(
			(callback) => getDateLineCountForChannel(channelUri, date, callback)
		);
	}

	async.parallel(calls, (err, results) => {
		if (err) {
			callback(err);
		}
		else {
			const t = results[0], y = results[1];
			const out = {
				[today]: t && t.count || 0,
				[yesterday]: y && y.count || 0
			};

			if (calls.length > 2) {
				const d = results[2];
				out[date] = d && d.count || 0;
			}

			callback(null, out);
		}
	});
};

const getUserLogDetails = function(username, date, callback) {
	const today = util.ymd(localMoment());
	const yesterday = util.ymd(localMoment().subtract(1, "day"));

	const calls = [
		(callback) => getDateLineCountForUsername(username, today, callback),
		(callback) => getDateLineCountForUsername(username, yesterday, callback)
	];

	if (date && date !== today && date !== yesterday) {
		calls.push(
			(callback) => getDateLineCountForUsername(username, date, callback)
		);
	}

	async.parallel(calls, (err, results) => {
		if (err) {
			callback(err);
		}
		else {
			const t = results[0], y = results[1];
			const out = {
				[today]: t && t.count || 0,
				[yesterday]: y && y.count || 0
			};

			if (calls.length > 2) {
				const d = results[2];
				out[date] = d && d.count || 0;
			}

			callback(null, out);
		}
	});
};

// Composite store functions

const addIrcServerFromDetails = function(details, callback) {
	if (details && details.name && details.data) {
		const name = util.formatUriName(details.name);
		const data = lodash.assign({}, details.data, { name });

		addServerToIrcConfig(
			data,
			(err, result) => {
				if (err) {
					callback(err);
				}
				else {
					// Add all channels
					if (data.channels && data.channels.length) {
						const channelNames = [];
						data.channels.forEach((channel) => {
							const channelName = channel.name || channel;

							if (typeof channelName === "string" && channelName) {
								channelNames.push(util.formatUriName(channelName));
							}
						});
						if (channelNames.length) {
							async.parallel(
								channelNames.map((channelName) =>
									((callback) => addChannelToIrcConfig(name, channelName, callback))
								),
								callback
							);
						}
						else {
							callback();
						}
					}
					else {
						callback();
					}
				}
			}
		)
	}
	else {
		callback(new Error("Insufficient data"));
	}
};

// Remote control IRC

const connectUnconnectedIrcs = function() {
	irc.connectUnconnectedClients();
};

const loadAndConnectUnconnectedIrcs = function(callback) {
	loadIrcConfig(() => {
		connectUnconnectedIrcs();

		if (typeof callback === "function") {
			callback();
		}
	});
};

const reconnectIrcServer = function(serverName) {
	irc.reconnectServer(serverName);
};

const disconnectIrcServer = function(serverName) {
	irc.disconnectServer(serverName);
};

const disconnectAndRemoveIrcServer = function(serverName) {
	irc.removeServer(serverName);
};

const joinIrcChannel = function(serverName, channelName) {
	irc.joinChannel(serverName, channelName);
};

const partIrcChannel = function(serverName, channelName) {
	irc.partChannel(serverName, channelName);
};

const currentIrcClients = function() {
	return irc.clients();
};

// Startup
onDb((err) => {
	console.log("Got db");
	if (err) {
		console.error("Got error loading database during startup", err);
		process.exit(1);
	}
	else {
		async.parallel(
			[
				onIo,
				onIrc,
				onPlugins,
				onWeb,
				loadAppConfig,
				loadFriendsList,
				loadIrcConfig,
				loadLastSeenChannels,
				loadLastSeenUsers,
				loadNicknames
			],
			(err, results) => {
				console.log("Everything's ready!");
				if (err) {
					console.error("Got error during startup", err);
					process.exit(1);
				}
				else {
					irc.go();
					web.go();
				}
			}
		);
	}
});

// API

module.exports = {
	addCategoryRecipient,
	addChannelRecipient,
	addChannelToIrcConfig,
	addConfigValueChangeHandler,
	addIrcServerFromDetails,
	addNickname,
	addServerToIrcConfig,
	addToFriends,
	addUserRecipient,
	cachedLastSeens: () => cachedLastSeens,
	clearCachedLastSeens,
	clearUnseenHighlights,
	configValue,
	connectUnconnectedIrcs,
	currentAppConfig: () => currentAppConfig,
	currentFriendsList: () => currentFriendsList,
	currentIrcClients,
	currentIrcConfig: () => currentIrcConfig,
	currentIrcConnectionState: () => currentIrcConnectionState,
	currentNicknames: () => currentNicknames,
	currentOnlineFriends: () => currentOnlineFriends,
	currentViewState: () => currentViewState,
	disconnectAndRemoveIrcServer,
	disconnectIrcServer,
	flushCachedLastSeens,
	getCategoryCache: (categoryName) => categoryCaches[categoryName],
	getChannelCache: (channelUri) => channelCaches[channelUri],
	getChannelLogDetails,
	getChannelRecipients: (channelUri) => channelRecipients[channelUri],
	getChannelUserList: (channelUri) => channelUserLists[channelUri],
	getDateLineCountForChannel,
	getDateLineCountForUsername,
	getDateLinesForChannel,
	getDateLinesForUsername,
	getLineByLineId,
	getUserCache: (username) => userCaches[username],
	getUserCurrentSymbol,
	getUserLogDetails,
	getUserRecipients: (username) => userRecipients[username],
	handleIncomingEvent,
	handleIncomingMessage,
	handleIrcConnectionStateChange,
	handleSystemLog,
	joinIrcChannel,
	lastSeenChannels: () => lastSeenChannels,
	lastSeenUsers: () => lastSeenUsers,
	loadAndConnectUnconnectedIrcs,
	loadAppConfig,
	loadFriendsList,
	loadIrcConfig,
	loadLastSeenChannels,
	loadLastSeenUsers,
	loadNicknames,
	localMoment,
	log: _log,
	modifyFriend,
	modifyNickname,
	modifyServerInIrcConfig,
	nicknamesDict,
	partIrcChannel,
	plugins: () => plugins,
	reconnectIrcServer,
	removeCategoryRecipient,
	removeChannelFromIrcConfig,
	removeChannelRecipient,
	removeFromFriends,
	removeNickname,
	removeRecipientEverywhere,
	removeServerFromIrcConfig,
	removeUserRecipient,
	reportHighlightAsSeen,
	safeAppConfig,
	safeIrcConfigDict,
	sendOutgoingMessage,
	setChannelUserList,
	setDb,
	setIo,
	setIrc,
	setPlugins,
	setWeb,
	storeConfigValue,
	storeViewState,
	unseenHighlightIds: () => unseenHighlightIds,
	warn: _warn
};
