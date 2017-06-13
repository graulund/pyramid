var currentIrcConnectionState = {};

const storeConnectionState = function(name, value) {
	currentIrcConnectionState[name] = value;
};

const deleteConnectionState = function(name) {
	delete currentIrcConnectionState[name];
};

module.exports = {
	currentIrcConnectionState: () => currentIrcConnectionState,
	deleteConnectionState,
	storeConnectionState
};
