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

const ym = function(d){
	if (!d) { d = new Date(); }
	return moment(d).format("YYYY-MM");
};

const hmsPrefix = function(str, d){
	return "[" + hms(d) + "] " + str;
};

const ymdhmsPrefix = function(str, d){
	return "[" + ymd(d) + " " + hms(d) + "] " + str;
};

module.exports = {
	hms,
	hmsPrefix,
	ym,
	ymd,
	ymdhmsPrefix
};
