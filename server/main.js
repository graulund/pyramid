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
var currentOnlineFriends = {};

var channelCaches = {};
var userCaches = {};
var categoryCaches = { highlights: [], allfriends: [] };
var currentHighlightContexts = {};

var channelRecipients = {};
var userRecipients = {};
var categoryRecipients = { highlights: [], allfriends: [] };

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

// Last seen

const setLastSeenChannel = (channel, data) => {
	if (data) {
		// Update
		lastSeenChannels[channel] = data;
		cachedLastSeens[`channel:${channel}`] = { channel, data };

		if (channelIdCache[channel]) {
			db.modifyChannelInIrcConfig(
				channelIdCache[channel],
				{
					lastSeenTime: data.time,
					lastSeenUsername: data.username
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

const setLastSeenUser = (username, data) => {
	if (data) {
		// Update
		lastSeenUsers[username] = data;
		cachedLastSeens[`user:${username}`] = { username, data };

		if (friendIdCache[username] && channelIdCache[data.channel]) {
			db.modifyFriend(
				friendIdCache[username],
				{
					lastSeenTime: data.time,
					lastSeenChannelId: channelIdCache[data.channel]
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
	channelUri, channelName, username, time, relationship
) {
	setLastSeenChannel(
		channelUri,
		{ username, time }
	);

	if (relationship >= constants.RELATIONSHIP_FRIEND) {
		setLastSeenUser(
			username,
			{ channel: channelUri, channelName, time }
		);
	}
};

const clearCachedLastSeens = () => {
	cachedLastSeens = {};
};

const flushCachedLastSeens = () => {
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

	if (highlights) {
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
	console.log(`>>> Storing ${Object.keys(bunchableLinesToInsert).length} bunchable lines`);
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
			var bunch;
			if (constants.BUNCHABLE_EVENT_TYPES.indexOf(lastItem.type) >= 0) {
				// Create bunch and insert in place
				bunch = {
					channel: lastItem.channel,
					channelName: lastItem.channelName,
					events: [lastItem, data],
					lineId: uuid.v4(),
					prevIds: [lastItem.lineId],
					server: lastItem.server,
					time: data.time,
					type: "events"
				};
			}
			else if (lastItem.type === "events") {
				// Add to bunch, resulting in a new, inserted in place
				bunch = {
					channel: lastItem.channel,
					channelName: lastItem.channelName,
					events: lastItem.events.concat([data]),
					lineId: uuid.v4(),
					prevIds: lastItem.prevIds.concat([lastItem.lineId]),
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

const getUserColorNumber = (username) => {
	username = username.toLowerCase();

	var hashedValue = new long(0);

	for (var i = 0; i < username.length; i++) {
		var c = username.charCodeAt(i);
		hashedValue = hashedValue.shiftLeft(6).add(hashedValue).add(c);
	}

	return hashedValue.mod(30).toNumber();
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

	// Log the line!
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
	if (username.toLowerCase() !== meUsername.toLowerCase()) {
		highlightStrings = getHighlightStringsForMessage(
			message, channelUri, meUsername
		);

		if (highlightStrings.length) {
			if (configValue("logLinesFile")) {
				log.logCategoryLine("mentions", channelUri, channelName, line, time);
			}
		}
	}

	updateLastSeen(
		channelUri, channelName, username, time, relationship
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

	const metadata = {
		channel: channelUri,
		channelName,
		lineId: uuid.v4(),
		relationship: data && data.username && util.getRelationship(data.username, currentFriendsList),
		server: serverName,
		time: time || new Date(),
		type
	};

	const event = lodash.assign(metadata, data);

	if (constants.BUNCHABLE_EVENT_TYPES.indexOf(type) >= 0) {
		cacheBunchableChannelEvent(channelUri, event);
	} else {
		cacheChannelEvent(channelUri, event);
	}
};

const handleIrcConnectionStateChange = function(serverName, status) {
	const info = { status, time: new Date() };
	currentIrcConnectionState[serverName] = info;

	if (io) {
		io.emitIrcConnectionStatus(serverName, info);
	}
}

const handleChatNetworkError = function(message) {
	console.log("WARN: Chat network error occurred:", message);

	// TODO: Add error to a server cache
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
	if (list[targetName]){
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

// See an unseen highlight

const reportHighlightAsSeen = function(messageId) {
	if (messageId) {
		unseenHighlightIds.delete(messageId);

		if (io) {
			io.emitUnseenHighlights();
		}
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
		console.log(`>>> Deleting ${lineIdsToDelete.size} old lines from db`);
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

const safeIrcConfigDict = function(ircConfig = currentIrcConfig) {
	var ircConfigDict = {};
	ircConfig.forEach((config) => {
		var outConfig = lodash.omit(config, ["password"]);
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
		return;
	}

	db.addServerToIrcConfig(data, callback);
};

const addToFriends = function(serverId, username, isBestFriend, callback) {
	db.addToFriends(serverId, username, isBestFriend, callback);
};

const storeConfigValue = function(name, value, callback) {
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
	async.waterfall([
		(callback) => db.getServerId(serverName, callback),
		(data, callback) => db.addChannelToIrcConfig(data.serverId, name, callback)
	], callback);
};

const removeChannelFromIrcConfig = function(serverName, name, callback) {
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

const getDateLinesForChannel = function(channelUri, date, callback) {
	const serverName = util.channelServerNameFromUrl(channelUri);
	const channelName = util.channelNameFromUrl(channelUri);

	async.waterfall([
		(callback) => db.getChannelId(serverName, channelName, callback),
		(data, callback) => db.getDateLinesForChannel(data.channelId, date, callback),
		(lines, callback) => parseDbLines(lines, callback)
	], callback);
};

const getDateLineCountForUsername = function(username, date, callback) {
	db.getDateLineCountForUsername(username, date, callback);
};

const getDateLinesForUsername = function(username, date, callback) {
	async.waterfall([
		(callback) => db.getDateLinesForUsername(username, date, callback),
		(lines, callback) => parseDbLines(lines, callback)
	], callback);
};

const getLineByLineId = function(lineId, callback) {
	async.waterfall([
		(callback) => db.getLineByLineId(lineId, callback),
		(line, callback) => parseDbLine(line, callback)
	], callback);
};

const getChannelLogDetails = function(channelUri, callback) {
	const today = util.ymd(moment());
	const yesterday = util.ymd(moment().subtract(1, "day"));

	// TODO: Time zone issue, database dates are UTC

	async.parallel([
		(callback) => getDateLineCountForChannel(channelUri, today, callback),
		(callback) => getDateLineCountForChannel(channelUri, yesterday, callback)
	], (err, results) => {
		if (err) {
			callback(err);
		}
		else {
			const t = results[0], y = results[1];
			callback(null, {
				[today]: !!(t && t.count && t.count > 0),
				[yesterday]: !!(y && y.count && y.count > 0)
			});
		}
	});
};

const getUserLogDetails = function(username, callback) {
	const today = util.ymd(moment());
	const yesterday = util.ymd(moment().subtract(1, "day"));

	async.parallel([
		(callback) => getDateLineCountForUsername(username, today, callback),
		(callback) => getDateLineCountForUsername(username, yesterday, callback)
	], (err, results) => {
		if (err) {
			callback(err);
		}
		else {
			const t = results[0], y = results[1];
			callback(null, {
				[today]: !!(t && t.count && t.count > 0),
				[yesterday]: !!(y && y.count && y.count > 0)
			});
		}
	});
};


// Remote control IRC

const connectUnconnectedIrcs = function() {
	irc.connectUnconnectedClients();
};

const reconnectIrcServer = function(serverName) {
	irc.reconnectServer(serverName);
};

const disconnectIrcServer = function(serverName) {
	irc.disconnectServer(serverName);
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
				loadLastSeenUsers,
				loadLastSeenChannels,
				loadIrcConfig,
				loadAppConfig,
				loadNicknames,
				loadFriendsList
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
	addNickname,
	addServerToIrcConfig,
	addToFriends,
	addUserRecipient,
	cachedLastSeens: () => cachedLastSeens,
	clearCachedLastSeens,
	configValue,
	connectUnconnectedIrcs,
	currentAppConfig: () => currentAppConfig,
	currentFriendsList: () => currentFriendsList,
	currentIrcConfig: () => currentIrcConfig,
	currentIrcClients,
	currentIrcConnectionState: () => currentIrcConnectionState,
	currentNicknames: () => currentNicknames,
	currentOnlineFriends: () => currentOnlineFriends,
	currentViewState: () => currentViewState,
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
	handleChatNetworkError,
	handleIncomingEvent,
	handleIncomingMessage,
	handleIrcConnectionStateChange,
	joinIrcChannel,
	lastSeenChannels: () => lastSeenChannels,
	lastSeenUsers: () => lastSeenUsers,
	loadAppConfig,
	loadFriendsList,
	loadIrcConfig,
	loadNicknames,
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
	removeServerFromIrcConfig,
	removeUserRecipient,
	reportHighlightAsSeen,
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
	unseenHighlightIds: () => unseenHighlightIds
};
