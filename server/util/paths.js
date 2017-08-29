const path = require("path");

const constants = require("../constants");

var localOverridePath;

const getDatabaseFilename = function() {
	if (localOverridePath) {
		return path.join(localOverridePath, "pyramid.db");
	}

	return constants.DB_FILENAME;
};

const getLogsRoot = function() {
	if (localOverridePath) {
		return path.join(localOverridePath, "logs");
	}

	return constants.LOG_ROOT;
};

const setLocalOverridePath = function(path) {
	localOverridePath = path;
};

module.exports = {
	getDatabaseFilename,
	getLogsRoot,
	setLocalOverridePath
};
