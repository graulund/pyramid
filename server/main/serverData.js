const _ = require("lodash");

module.exports = function(io) {

	var serverData = {};

	const clearServerData = function() {
		serverData = {};
	};

	const getServerData = function(server) {
		return serverData[server];
	};

	const getAllServerData = function() {
		return serverData;
	};

	const setServerData = function(server, data) {
		let current = serverData[server] || {};
		serverData[server] = _.assign(current, data);

		if (io) {
			io.emitServerData(null, server);
		}
	};

	return {
		clearServerData,
		getServerData,
		getAllServerData,
		setServerData
	};
};
