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

	const output = { handleEvent };

	main.setPlugins(output);

	return output;
};
