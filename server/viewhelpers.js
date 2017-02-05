// PYRAMID
// View helper functions

const log = require("./log");

const ucfirst = function(str){
	const f = str.charAt(0)
		.toUpperCase();
	return f + str.substr(1)
};

const formatTime = function(milliseconds){
	var seconds = Math.floor(milliseconds / 1000)
	var days    = Math.floor(seconds / 86400)
	seconds = seconds % 86400
	var hours   = Math.floor(seconds / 3600)
	seconds = seconds % 3600
	var minutes = Math.floor(seconds / 60)
	seconds = seconds % 60
	return {
		day: days,
		hour: hours,
		min: minutes,
		sec: seconds
	}
};

const timeClassName = function(milliseconds){
	var info = milliseconds
	if(typeof milliseconds != "object"){
		info = formatTime(milliseconds)
	}

	if(info.day > 0){
		return "days"
	}

	if(info.hour >= 10){
		return "manyhours"
	}

	if(info.hour > 0){
		return "hours-" + info.hour
	}

	if(info.min >= 10){
		return "minutes-" + Math.floor(info.min / 10) * 10
	}

	if(info.min > 0){
		return "minutes-" + info.min
	}

	return "now"
};

const timeOpacity = function(secondsSince){
	// Exponential fall
	const maxSeconds = 2*3600

	// MATLAB
	// solve(100 == x^86400) = 10^(1/43200)

	return 1/Math.pow(Math.pow(10, 1/(maxSeconds/2)), secondsSince)
};

const timeTextOpacity = function(secondsSince){
	// Linear fall
	// const maxSeconds = 12*3600, minSeconds = 2*3600
	const minOpacity = 0.2, maxOpacity = 1

	// MATLAB
	// y1 = 1; y2 = 0.2; x1 = 2*3600; x2 = 12*3600
	// solve(y - y1 == (y2-y1)/(x2-x1)*(x - x1), y)

	return Math.max(minOpacity, Math.min(maxOpacity, 29/25 - secondsSince/45000))
};

const logSplitterHeight = function(secondsPassed){
	// One hour => 5px
	// Five days => 90px
	// y = x/5040+30/7

	return Math.round(Math.max(5, Math.min(90, secondsPassed/5040+30/7)) * 100) / 100
};

const convertLogFileToLineObjects = function(data, date){
	var lines = data.split("\n")
	for(var i = 0; i < lines.length; i++){
		// Convert item to obj instead of str
		lines[i] = log.parseLogLine(lines[i], date)
	}
	return lines
};

module.exports = {
	ucfirst: ucfirst,
	formatTime: formatTime,
	timeClassName: timeClassName,
	timeOpacity: timeOpacity,
	timeTextOpacity: timeTextOpacity,
	logSplitterHeight: logSplitterHeight,
	convertLogFileToLineObjects: convertLogFileToLineObjects
};