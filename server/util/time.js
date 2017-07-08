const moment = require("moment-timezone");
// TODO: Handle time zone?

const hms = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).format("HH:mm:ss");
};

const ymd = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).format("YYYY-MM-DD");
};

const ym = function(d) {
	if (!d) { d = new Date(); }
	return moment(d).format("YYYY-MM");
};

const hmsPrefix = function(str, d) {
	return "[" + hms(d) + "] " + str;
};

const ymdhmsPrefix = function(str, d) {
	return "[" + ymd(d) + " " + hms(d) + "] " + str;
};

const offsetDate = function(date, days) {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate() + days,
		date.getHours(),
		date.getMinutes(),
		date.getSeconds(),
		date.getMilliseconds()
	);
};

module.exports = {
	hms,
	hmsPrefix,
	offsetDate,
	ym,
	ymd,
	ymdhmsPrefix
};
