const lodash = require("lodash");

const config = require("../config");
const dbSource = require("../server/db");

var db;

dbSource({ setDb: (_) => { db = _; } }, () => {

	const callback = (err, data) => {
		if (err) {
			throw err;
		}
	};

	db._db.serialize(function() {
		db._db.run('DROP INDEX "username"', callback);
		db._db.run('DROP INDEX "date"', callback);
		db._db.run('DROP INDEX "channelId"', callback);
		db._db.run('CREATE INDEX "channelDateTime" ON "lines" ("channelId","time","date")', callback);
		db._db.run('CREATE INDEX "usernameDateTime" ON "lines" ("time","date","username")', callback);
		db._db.run('VACUUM', callback);
	});
});
