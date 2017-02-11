// PYRAMID
// Plugin interface

const path = require("path");
const fs = require("fs");

module.exports = function(main) {
	// Constants

	const PLUGINS_FOLDER = path.join(__dirname, "..", "serverplugins");

	// State

	var pluginNames = [];
	var plugins = [];

	const init = () => {
		pluginNames = fs.readdirSync(PLUGINS_FOLDER).filter((n) => /\.js$/.test(n));
		plugins = pluginNames.map((name) => {
			var plugin = require(path.join(PLUGINS_FOLDER, name));

			if (typeof plugin === "function") {
				plugin = plugin(main);
			}

			return plugin;
		});
	};

	const getHandlerName = (eventName) => {
		return "on" + eventName[0].toUpperCase() + eventName.substr(1);
	};

	const handleEvent = (name, data) => {
		plugins.forEach((plugin) => {
			const handlerName = getHandlerName(name);
			if (plugin && typeof plugin[handlerName] === "function") {
				plugin[handlerName](data);
			}
		});
	};

	init();

	const output = {
		init,
		handleEvent
	};

	main.setPlugins(output);

	return output;
};
