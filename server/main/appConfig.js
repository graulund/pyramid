const _ = require("lodash");

const constants = require("../constants");
const configDefaults = require("../defaults");
const passwordUtils = require("../util/passwords");

module.exports = function(db) {

	// State

	var currentAppConfig = {};
	var configValueChangeHandlers = {};
	var restricted = false;

	// Database core functions

	const getConfigValue = function(name, callback) {
		db.getConfigValue(name, callback);
	};

	const getAllConfigValues = function(callback) {
		db.getAllConfigValues(callback);
	};

	// Get data

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

	// Output data

	const safeAppConfig = function(appConfig = currentAppConfig) {
		let outConfig = _.omit(appConfig, [
			"httpsCertPath",
			"httpsKeyPath",
			"webPassword"
		]);

		if (appConfig.webPassword) {
			// Signal that a password has been set
			outConfig.webPassword = true;
		}

		return outConfig;
	};

	// Config values

	const configValue = function(name) {

		if (typeof currentAppConfig[name] !== "undefined") {
			return currentAppConfig[name];
		}

		return configDefaults[name];
	};

	const storeConfigValue = function(name, value, callback) {

		var rawValue;

		if (name === "webPassword") {
			if (!value) {
				// Do not allow the setting of an empty web password
				callback(new Error("Empty web password"));
				return;
			}
			else {
				// Hash the web password
				rawValue = value;
				value = passwordUtils.generatePasswordHash(value);
			}
		}

		// Check if we're in restricted mode and deny change

		if (
			restricted &&
			constants.RESTRICTED_APP_CONFIG_PROPERTIES.indexOf(name) >= 0
		) {
			callback(new Error("Restricted app config property"));
			return;
		}

		db.storeConfigValue(
			name,
			value,
			(err) => {
				if (err) {
					if (typeof callback === "function") {
						callback(err, value);
					}
				}
				else {
					// Handle new value
					const handlers = configValueChangeHandlers[name];
					if (handlers && handlers.length) {
						loadAppConfig(() => {
							handlers.forEach((handler) => {
								handler(value, name, rawValue);
							});
						});
					}

					if (typeof callback === "function") {
						callback(null, value);
					}
				}
			}
		);
	};

	const getRestrictionData = function() {
		let mode = configValue("restrictedMode");
		restricted = mode;

		if (!mode) {
			return null;
		}

		return {
			// TODO: Implement messagesPerSecondLimit
			messagesPerSecondLimit: configValue("restrictedMessagesPerSecondLimit"),
			channelsLimit: configValue("restrictedChannelsLimit"),
			serversLimit: configValue("restrictedServersLimit"),
			nicknamesLimit: configValue("restrictedNicknamesLimit"),
			friendsLimit: configValue("restrictedFriendsLimit"),
			connectionsLimit: configValue("restrictedConnectionsLimit")
		};
	};

	// Change handlers

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

	// Out

	return {
		addConfigValueChangeHandler,
		configValue,
		currentAppConfig: () => currentAppConfig,
		getConfigValue,
		getRestrictionData,
		loadAppConfig,
		safeAppConfig,
		storeConfigValue
	};
};
