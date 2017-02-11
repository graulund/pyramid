// PYRAMID
// Plugin interface

const path = require("path");
const fs = require("fs");

// Constants

const PLUGINS_FOLDER = path.join(__dirname, "..", "serverplugins");

// State

var pluginNames = [];
var plugins = [];

const init = () => {
	pluginNames = fs.readdirSync(PLUGINS_FOLDER).filter((n) => /\.js$/.test(n));
	plugins = pluginNames.map((name) => require(path.join(PLUGINS_FOLDER, name)));
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

module.exports = {
	init,
	handleEvent
};
