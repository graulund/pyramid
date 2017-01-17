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

	var channelNameFromUrl = function(url) {
		if (url && url.replace) {
			return url.replace(/^[^\/]+\//, "#");
		}

		return null;
	}

	var channelServerNameFromUrl = function(url) {
		var m;
		if (url && url.match && (m = url.match(/^([^\/]+)\//)) && m[1]) {
			return m[1];
		}

		return null;
	}

	var channelUrlFromNames = function(server, channel) {
		return server + "/" + channel.replace(/^#/, "");
	}

	var acceptedTokens = [];

	const addToAcceptedTokens = function(token) {
		if (token) {
			acceptedTokens = [ ...acceptedTokens, token ];
		}
	};

	const isAnAcceptedToken = function(token) {
		return acceptedTokens.indexOf(token) >= 0;
	};

	const clearAcceptedTokens = function() {
		acceptedTokens = [];
	};

	const generateToken = function(length = 60) {
		const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		var output = "";
		for(var i = 0; i < length; i++) {
			output += alpha[Math.round((alpha.length-1)*Math.random())];
		}
		return output;
	};

	const generateAcceptedToken = function(length = 60) {
		const token = generateToken(length);
		addToAcceptedTokens(token);
		return token;
	};

	return {
		hms,
		ymd,
		ym,
		hmsPrefix,
		ymdhmsPrefix,
		channelNameFromUrl,
		channelServerNameFromUrl,
		channelUrlFromNames,
		addToAcceptedTokens,
		isAnAcceptedToken,
		generateToken,
		generateAcceptedToken,
		clearAcceptedTokens
	}
};
