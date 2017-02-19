import { DEFAULT_COLOR_RGB, ROOT_PATHNAME } from "../constants";

export function ucfirst(str){
	var f = str.charAt(0)
		.toUpperCase();
	return f + str.substr(1);
}

export function formatTime(milliseconds){
	var seconds = Math.floor(milliseconds / 1000);

	var days = Math.floor(seconds / 86400);
	seconds = seconds % 86400;

	var hours = Math.floor(seconds / 3600);
	seconds = seconds % 3600;

	var minutes = Math.floor(seconds / 60);
	seconds = seconds % 60;

	return {
		day: days,
		hour: hours,
		min: minutes,
		sec: seconds
	};
}

export function timeOpacity(secondsSince) {
	// Exponential fall
	var maxSeconds = 2*3600;
	return 1/Math.pow(Math.pow(10, 1/(maxSeconds/2)), secondsSince);
}

export function timeTextOpacity(secondsSince) {
	// Linear fall
	var minOpacity = 0.2, maxOpacity = 1;
	return Math.max(minOpacity, Math.min(maxOpacity, 29/25 - secondsSince/45000));
}

export function timeColors (m, ms, color = DEFAULT_COLOR_RGB) {
	// m: Moment instance expected
	// ms: Moment diff instance expected; moment().diff(m)

	// Color
	var backgroundOpacity = timeOpacity(ms/1000),
		textColor = "#000",
		opacity = timeTextOpacity(ms/1000);

	if(backgroundOpacity >= 0.3){
		textColor = "#fff";
	}

	return {
		backgroundColor: `rgba(${color},${backgroundOpacity})`,
		color: textColor,
		opacity
	};
}

export function minuteTime(timeStamp) {
	// Less granularity

	if (typeof timeStamp === "string") {
		return timeStamp.replace(/T([0-9]+:[0-9]+)([:.0-9]*)/, "T$1");
	}

	return timeStamp;
}

export function internalUrl(url) {
	return ROOT_PATHNAME + url;
}

/*function round2(val){
	return Math.round(val * 100) / 100;
}

function pathname(){
	var pn = location.pathname;
	// Replace double slashes with just one /
	pn = pn.replace(/\/+/g, "/");
	return pn;
}

function areWeScrolledToTheBottom(){
	// Are we scrolled to the bottom?
	// --> Elements that have heights and offsets that matter
	var b = $("body"), w = $(window), c = $("#container");
	// --> Two oft-used heights
	var ch = c.height(), wh = w.height();
	// --> The calculation!
	return (ch - (b.scrollTop() + wh)) <= 100 || wh >= ch;
}

function scrollToTheBottom(){
	$("body").scrollTop($("#content").height());
} */
