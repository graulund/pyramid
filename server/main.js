// PYRAMID
// Main data logic

const async = require("async");

const pathUtils = require("./util/paths");

// Basic state

const awakeTime = new Date();
var readyCallbacks = [], isReady = false, restriction;

// Sub model objects not requiring state

const ircConnectionState = require("./main/ircConnectionState");
const viewState = require("./main/viewState");

// Sub model objects requiring state (delayed initialization)

var appConfig;
var channelData;
var friends;
var incomingEvents;
var ircConfig;
var ircControl;
var ircPasswords;
var lastSeen;
var logs;
var messageCaches;
var nicknames;
var recipients;
var serverData;
var unseenHighlights;
var unseenConversations;
var userLists;

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

const _log = function(message, level = "info", time = null) {
	if (incomingEvents) {
		incomingEvents.handleSystemLog(null, message, level, time);
	}
	else {
		console.log(message);
	}
};

const _warn = function(message, time = null) {
	_log(message, "warning", time);
};

// Ready callbacks

const addReadyCallback = function(callback) {
	if (isReady) {
		// Fire off immediately if ready
		callback();
	}

	else {
		readyCallbacks.push(callback);
	}
};

const fireReadyCallbacks = function() {
	isReady = true;
	readyCallbacks.forEach((callback) => callback());
	readyCallbacks = [];
};

// Startup

const initDependencies = function() {
	async.parallel(
		[
			onIo,
			onIrc,
			onPlugins,
			onWeb
		],
		(err) => {
			if (err) {
				console.error("Got error during startup", err);
				process.exit(1);
			}
			else {
				console.log("Dependencies loaded");
				getAppConfigAndStartup();
			}
		}
	);
};

const getAppConfigAndStartup = function() {
	appConfig = require("./main/appConfig")(db);

	appConfig.loadAppConfig(function(err) {
		if (err) {
			console.error("Got error during startup", err);
			process.exit(1);
		}

		else {
			console.log("Configuration loaded");
			restriction = appConfig.getRestrictionData();
			io.setRestriction(restriction);
			initStartup();
		}
	});
};

const initStartup = function() {
	channelData      = require("./main/channelData")(io);
	friends          = require("./main/friends")(db, restriction);
	ircConfig        = require("./main/ircConfig")(db, io, restriction);
	lastSeen         = require("./main/lastSeen")(db);
	nicknames        = require("./main/nicknames")(db, restriction);
	recipients       = require("./main/recipients")(io);
	serverData       = require("./main/serverData")(io);
	unseenHighlights = require("./main/unseenHighlights")(io);
	unseenConversations = require("./main/unseenConversations")(io);
	userLists        = require("./main/userLists")(io, friends);
	ircControl       = require("./main/ircControl")(
		irc, ircConfig, io
	);
	ircPasswords     = require("./main/ircPasswords")(
		irc, appConfig, ircConfig
	);
	logs             = require("./main/logs")(
		db, appConfig, ircConfig, nicknames
	);
	messageCaches    = require("./main/messageCaches")(
		db,
		io,
		appConfig,
		ircConfig,
		logs,
		recipients,
		unseenHighlights,
		unseenConversations
	);
	incomingEvents   = require("./main/incomingEvents")(
		io,
		appConfig,
		ircConfig,
		nicknames,
		userLists,
		lastSeen,
		messageCaches,
		friends,
		ircConnectionState
	);

	finalizeStartup();
};

const finalizeStartup = function() {
	async.parallel(
		[
			friends.loadFriendsList,
			ircConfig.loadIrcConfig,
			lastSeen.loadLastSeenChannels,
			lastSeen.loadLastSeenUsers,
			nicknames.loadNicknames
		],
		(err) => {
			if (err) {
				console.error("Got error during startup", err);
				process.exit(1);
			}
			else {
				console.log("Data loaded");
				ircPasswords.onStartUp();
				irc.go();
				web.go();
				fireReadyCallbacks();
			}
		}
	);
};

// Startup

console.log("Welcome to Pyramid");

onDb((err) => {
	if (err) {
		console.error("Got error loading database during startup", err);
		process.exit(1);
	}
	else {
		console.log("Database connected");
		initDependencies();
	}
});

// API

module.exports = {
	appConfig: () => appConfig,
	awakeTime,
	channelData: () => channelData,
	friends: () => friends,
	incomingEvents: () => incomingEvents,
	ircConfig: () => ircConfig,
	ircConnectionState,
	ircControl: () => ircControl,
	ircPasswords: () => ircPasswords,
	lastSeen: () => lastSeen,
	log: _log,
	logs: () => logs,
	messageCaches: () => messageCaches,
	nicknames: () => nicknames,
	onReady: addReadyCallback,
	plugins: () => plugins,
	recipients: () => recipients,
	serverData: () => serverData,
	setDb,
	setIo,
	setIrc,
	setLocalOverridePath: pathUtils.setLocalOverridePath,
	setPlugins,
	setWeb,
	unseenHighlights: () => unseenHighlights,
	unseenConversations: () => unseenConversations,
	userLists: () => userLists,
	viewState,
	warn: _warn
};
