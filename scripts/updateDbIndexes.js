const dbSource = require("../server/db");

var db;

dbSource({ setDb: (_) => { db = _; } }, () => {

	const callback = function(message) {
		return function(err, data) {
			if (err) {
				console.error("Error: " + message);
				//throw err;
			}
			else {
				console.log("Success: " + message);
			}
		};
	};

	console.log("This could take a while... hold on.");

	db._db.serialize(function() {
		db._db.run(
			'DROP INDEX "username"',
			callback("Drop username index")
		);
		db._db.run(
			'DROP INDEX "date"',
			callback("Drop date index")
		);
		db._db.run(
			'DROP INDEX "channelId"',
			callback("Drop channel id index")
		);
		db._db.run(
			'CREATE INDEX "channelDateTime" ON "lines" ("channelId","time","date")',
			callback("Create index channel date time")
		);
		db._db.run(
			'CREATE INDEX "usernameDateTime" ON "lines" ("time","date","username")',
			callback("Create index username date time")
		);
		db._db.run(
			'VACUUM',
			callback("Vacuum")
		);
	});
});
