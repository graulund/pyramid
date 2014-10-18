// IRC WATCHER
// Utilities module

var moment = require("moment-timezone")

module.exports = function(config){

	// Time utilities
	var hms = function(d){
		if(!d){
			d = new Date()
		}
		return moment(d).tz(config.timeZone).format("HH:mm:ss")
	}

	var ymd = function(d){
		if(!d){
			d = new Date()
		}
		return moment(d).tz(config.timeZone).format("YYYY-MM-DD")
	}

	var ym = function(d){
		if(!d){
			d = new Date()
		}
		return moment(d).tz(config.timeZone).format("YYYY-MM")
	}

	var hmsPrefix = function(str, d){
		return "[" + hms(d) + "] " + str
	}

	var ymdhmsPrefix = function(str, d){
		return "[" + ymd(d) + " " + hms(d) + "] " + str
	}

	return {
		hms: hms,
		ymd: ymd,
		ym:  ym,
		hmsPrefix: hmsPrefix,
		ymdhmsPrefix: ymdhmsPrefix
	}
}
