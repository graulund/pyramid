const _ = require("lodash");

const configDefaults = require("../defaults");
const passwordUtils = require("../util/passwords");

module.exports = function(db) {

	// State

	var currentAppConfig = {};
	var configValueChangeHandlers = {};

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
		var outConfig = _.omit(appConfig, ["webPassword"]);

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

		if (name === "webPassword" && !value) {
			if (!value) {
				// Do not allow the setting of an empty web password
				callback(new Error("Empty web password"));
				return;
			}
			else {
				// Hash the web password
				value = passwordUtils.generatePasswordHash(value);
			}
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
		loadAppConfig,
		safeAppConfig,
		storeConfigValue
	};
};
