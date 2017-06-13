const moment = require("moment-timezone");

const dbSource = require("../server/db");
const util = require("../server/util");

// State
var db;
var timeZone = "";

// Util
const localMoment = function(arg) {
	if (!timeZone) {
		throw new Error("Time zone wasn't set.");
	}

	return moment(arg).tz(timeZone);
};

const getLocalDatestampFromTime = (time) => {
	return util.ymd(localMoment(time));
};

// Load db
dbSource({ localMoment, setDb: (_) => { db = _; } }, () => {

	// Load time zone settings
	db.getConfigValue("timeZone", (err, val) => {
		if (val && typeof val === "string") {
			timeZone = val;

			console.log("Got time zone: " + timeZone);
			console.log();

			// Main action
			db._db.each("SELECT lineId, time, date FROM lines", (err, row) => {
				if (err) {
					console.error("Read error:", err);
				}
				else if (row && row.lineId && row.time) {
					const localDate = getLocalDatestampFromTime(row.time);
					if (localDate !== row.date) {
						console.log(`Updating ${row.lineId}`);
						console.log(`\tLocal date for ${row.time} is ${localDate}`);

						db._db.run("UPDATE lines SET date = $date WHERE lineId = $lineId", {
							$date: localDate,
							$lineId: row.lineId
						}, (err) => {
							if (err) {
								console.error("Write error:", err);
							}
						});
					}
				}
			});
		}
	});
});
