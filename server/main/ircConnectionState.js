const _ = require("lodash");

var currentIrcConnectionState = {};

const storeConnectionState = function(name, value) {
	currentIrcConnectionState[name] = value;
};

const deleteConnectionState = function(name) {
	delete currentIrcConnectionState[name];
};

const addToConnectionState = function(name, values) {
	let state = currentIrcConnectionState[name];
	currentIrcConnectionState[name] = _.assign(state || {}, values);
};

module.exports = {
	addToConnectionState,
	currentIrcConnectionState: () => currentIrcConnectionState,
	deleteConnectionState,
	storeConnectionState
};
