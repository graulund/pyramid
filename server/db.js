const fs = require("fs");
const path = require("path");

// Look for DB configuration file

var dbInfo, dbTypeName = "sqlite";

try {
	dbInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "dbinfo.json")));

	// Apply database type
	if (dbInfo && dbInfo.type) {
		dbTypeName = dbInfo.type;
	}
}

catch (e) {
	// Use default
}

module.exports = require(`./db/${dbTypeName}`)(dbInfo);
