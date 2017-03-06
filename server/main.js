// PYRAMID
// Main data logic

const async  = require("async");
const lodash = require("lodash");
const long   = require("long");
const uuid   = require("uuid");

//const config = require("../config");
const constants = require("./constants");
const configDefaults = require("./defaults");
const log = require("./log");
const util = require("./util");

// Application state

var currentAppConfig = {};
var currentIrcConfig = [];
var currentNicknames = [];
var currentFriendsList = [];

var lastSeenChannels = log.loadLastSeenChannels();
var lastSeenUsers = log.loadLastSeenUsers();

var channelUserLists = {};

var channelCaches = {};
var userCaches = {};
var categoryCaches = { highlights: [], allfriends: [] };

var channelRecipients = {};
var userRecipients = {};
var categoryRecipients = { highlights: [], allfriends: [] };

var cachedLastSeens = {};

var unseenHighlightIds = new Set();

var currentViewState = {};

// (name/uri => id caches)

var channelIdCache = {};
var serverIdCache = {};

var bunchableLinesToInsert = {};
var lineIdsToDelete = new Set();

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

// Chat code

const setLastSeenChannel = (channel, data) => {
	lastSeenChannels[channel] = data;
	log.writeLastSeenChannels(lastSeenChannels);
	cachedLastSeens[`channel:${channel}`] = { channel, data };
};

const setLastSeenUser = (username, data) => {
	lastSeenUsers[username] = data;
	log.writeLastSeenUsers(lastSeenUsers);
	cachedLastSeens[`user:${username}`] = { username, data };
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
			{
				channel: channelUri,
				channelName,
				time
			}
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
		const channelId = channelIdCache[channelUri];
		if (channelId) {
			storeLine(channelId, data);
		}
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

	if (categoryName === "highlights" && msg.id) {
		unseenHighlightIds.add(msg.id);

		if (io) {
			io.emitNewHighlight(null, msg);
			io.emitUnseenHighlights();
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
	if (configValue("logLinesDb") && data && data.id) {
		bunchableLinesToInsert[data.id] = { channelUri, data };
	}
};

const _scheduledBunchableStore = function() {
	console.log(`>>> Storing ${Object.keys(bunchableLinesToInsert).length} bunchable lines`);
	lodash.forOwn(bunchableLinesToInsert, (line, key) => {
		if (line && line.channelUri && line.data) {
			const channelId = channelIdCache[line.channelUri];
			if (channelId) {
				storeLine(channelId, line.data);
			}
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
					id: uuid.v4(),
					prevIds: [lastItem.id],
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
					id: uuid.v4(),
					prevIds: lastItem.prevIds.concat([lastItem.id]),
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
		id: uuid.v4(),
		message,
		relationship,
		server: serverName,
		symbol,
		tags,
		time,
		type,
		username
	};

	cacheChannelEvent(channelUri, msg);
	if (relationship >= constants.RELATIONSHIP_FRIEND) {
		cacheUserMessage(username, msg);
		cacheCategoryMessage("allfriends", msg);
	}
	if (highlightStrings && highlightStrings.length) {
		cacheCategoryMessage("highlights", msg);
	}
};

const setChannelUserList = function(channelUri, userList) {
	if (channelUri) {
		channelUserLists[channelUri] = userList || {};
	}
};

const getUserCurrentSymbol = function(channelUri, userName) {
	if (channelUri && channelUserLists[channelUri]) {
		return channelUserLists[channelUri][userName] || "";
	}

	return "";
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

const handleIncomingMessage = function(
	channelUri, channelName, serverName, username,
	time, type, message, tags, meUsername
) {
	const symbol = getUserCurrentSymbol(channelUri, username);
	const line = log.lineFormats[type].build(symbol, username, message);

	// Log the line!
	log.logChannelLine(channelUri, channelName, line, time);

	// Is this from a person among our friends? Note down "last seen" time.

	const relationship = util.getRelationship(username, currentFriendsList);

	if (relationship >= constants.RELATIONSHIP_FRIEND) {
		// Add to specific logs
		log.logCategoryLine(username.toLowerCase(), channelUri, channelName, line, time);
	}

	var highlightStrings = [];

	// Mention? Add to specific logs
	var meRegex = new RegExp("\\b" + meUsername + "\\b", "i");
	var loggedMention = false;
	if (meRegex.test(message)) {
		highlightStrings.push(meUsername);
		log.logCategoryLine("mentions", channelUri, channelName, line, time);
		loggedMention = true;
	}

	for (var i = 0; i < currentNicknames.length; i++) {
		var nickRegex = new RegExp("\\b" + currentNicknames[i].nickname + "\\b", "i")
		if (
			nickRegex.test(message) &&
			util.passesChannelWhiteBlacklist(currentNicknames, channelUri)
		) {
			highlightStrings.push(currentNicknames[i].nickname);

			if (!loggedMention) {
				log.logCategoryLine("mentions", channelUri, channelName, line, time);
				loggedMention = true;
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

	if (line) {
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
	}

	const metadata = {
		channel: channelUri,
		channelName,
		id: uuid.v4(),
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

const handleChatNetworkError = function(message) {
	console.log("WARN: Chat network error occurred:", message);
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

const getFriendsList = function(callback) {
	db.getFriendsList(callback);
};

const storeLine = function(channelId, line, callback = function(){}) {
	db.storeLine(channelId, line, callback);
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

const configValue = function(name) {
	return currentAppConfig[name] || configDefaults[name];
};

// Storing settings

const getServerId = function(serverName, callback) {
	db.getServerId(serverName, callback);
};

const addServerToIrcConfig = function(data, callback) {
	db.addServerToIrcConfig(data, callback);
};

const addToFriends = function(serverId, username, isBestFriend, callback) {
	db.addToFriends(serverId, username, isBestFriend, callback);
};

const storeConfigValue = function(name, value, callback) {
	db.storeConfigValue(name, value, callback);
};

// TODO: Use server name instead of server id here
const modifyFriend = function(serverId, username, data, callback) {
	async.waterfall([
		(callback) => getFriend(serverId, username, callback),
		(friend, callback) => db.modifyFriend(friend.friendId, data, callback)
	], callback);
};

const removeFromFriends = function(serverId, username, callback) {
	async.waterfall([
		(callback) => getFriend(serverId, username, callback),
		(friend, callback) => db.removeFromFriends(friend.friendId, callback)
	], callback);
};

const modifyServerInIrcConfig = function(serverName, details, callback) {
	async.waterfall([
		(callback) => getServerId(serverName, callback),
		(data, callback) => db.modifyServerInIrcConfig(data.serverId, details, callback)
	], callback);
};

const removeServerFromIrcConfig = function(serverName, callback) {
	async.waterfall([
		(callback) => getServerId(serverName, callback),
		(data, callback) => db.removeServerFromIrcConfig(data.serverId, callback)
	], callback);
};

const addChannelToIrcConfig = function(serverName, name, callback) {
	async.waterfall([
		(callback) => getServerId(serverName, callback),
		(data, callback) => db.addChannelToIrcConfig(data.serverId, name, callback)
	], callback);
};

const removeChannelFromIrcConfig = function(serverName, name, callback) {
	async.waterfall([
		(callback) => getChannelId(serverName, name, callback),
		(data, callback) => db.removeChannelFromIrcConfig(data.channelId, callback)
	], callback);
};

// Remote control IRC

const connectUnconnectedIrcs = function() {
	irc.connectUnconnectedClients();
};

const disconnectIrcServer = function(serverName) {
	irc.disconnectServer(serverName);
}

const joinIrcChannel = function(serverName, channelName) {
	irc.joinChannel(serverName, channelName);
};

const partIrcChannel = function(serverName, channelName) {
	irc.partChannel(serverName, channelName);
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
	currentNicknames: () => currentNicknames,
	currentViewState: () => currentViewState,
	disconnectIrcServer,
	flushCachedLastSeens,
	getCategoryCache: (categoryName) => categoryCaches[categoryName],
	getChannelCache: (channelUri) => channelCaches[channelUri],
	getChannelRecipients: (channelUri) => channelRecipients[channelUri],
	getChannelUserList: (channelUri) => channelUserLists[channelUri],
	getUserCache: (username) => userCaches[username],
	getUserCurrentSymbol,
	getUserRecipients: (username) => userRecipients[username],
	handleChatNetworkError,
	handleIncomingEvent,
	handleIncomingMessage,
	joinIrcChannel,
	lastSeenChannels: () => lastSeenChannels,
	lastSeenUsers: () => lastSeenUsers,
	loadAppConfig,
	loadFriendsList,
	loadIrcConfig,
	loadNicknames,
	modifyFriend,
	modifyServerInIrcConfig,
	partIrcChannel,
	plugins: () => plugins,
	removeCategoryRecipient,
	removeChannelFromIrcConfig,
	removeChannelRecipient,
	removeFromFriends,
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
