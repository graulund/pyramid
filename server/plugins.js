// PYRAMID
// Plugin interface

const fs = require("fs");
const path = require("path");

const PLUGINS_FOLDER = path.join(__dirname, "..", "serverplugins");

function pluginFolderPath(name) {
	return path.join(PLUGINS_FOLDER, name);
}

function pluginIndexPath(name) {
	return path.join(PLUGINS_FOLDER, name, "index.js");
}

function getHandlerName(eventName) {
	return "on" + eventName[0].toUpperCase() + eventName.substr(1);
}

module.exports = function(main) {

	// State

	var pluginNames = [];
	var plugins = [];

	// Handler

	function handleEvent(name, data) {
		plugins.forEach((plugin) => {
			const handlerName = getHandlerName(name);
			if (plugin && typeof plugin[handlerName] === "function") {
				plugin[handlerName](data);
			}
		});
	}

	// Handler for query events: Handlers that can stop the event from taking place

	function handleQueryEvent(name, data, callback) {
		for (var i = 0; i < plugins.length; i++) {
			let plugin = plugins[i];
			const handlerName = getHandlerName(name);
			if (plugin && typeof plugin[handlerName] === "function") {
				let result = plugin[handlerName](data, callback);

				// Give it to the first plugin that gives a non-falsy response
				// It is this plugin's responsibility to either call the callback,
				// or intentionally omit it.

				// It is important that they only call the callback if they return
				// a non-falsy response, otherwise it will be called at least twice.

				if (result) {
					return;
				}
			}
		}

		// If we're here, no one handled it, so call the callback
		callback();
	}

	// Start up

	let pluginFolderItems = fs.readdirSync(PLUGINS_FOLDER);
	pluginFolderItems.forEach((name) => {
		if (name && name[0] !== ".") {
			let stat = fs.statSync(pluginFolderPath(name));
			if (stat && stat.isDirectory()) {
				let indexPath = pluginIndexPath(name);
				try {
					fs.accessSync(indexPath, fs.constants.R_OK);
					pluginNames.push(name);
				}
				catch (e) {
					// Inaccessible
				}
			}
		}
	});

	plugins = pluginNames.map((name) => {
		var plugin = require(pluginIndexPath(name));

		if (typeof plugin === "function") {
			plugin = plugin(main);
		}

		console.log("Loaded plugin: " + name);

		return plugin;
	});

	const output = { handleEvent, handleQueryEvent };

	main.setPlugins(output);

	return output;
};
