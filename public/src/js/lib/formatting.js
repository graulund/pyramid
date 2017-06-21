import {
	ACTIVITY_COLOR_RGB,
	DARKMODE_ACTIVITY_COLOR_RGB,
	DARKMODE_FG_COLOR,
	DARKMODE_INVERTED_FG_COLOR,
	FG_COLOR,
	INVERTED_FG_COLOR,
	ROOT_PATHNAME
} from "../constants";
import store from "../store";

export const MONTHS = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];

export const DAYS = [
	"Sunday", "Monday", "Tuesday", "Wednesday",
	"Thursday", "Friday", "Saturday"
];

const DEFAULT_DATE_SUFFIX = "th";
const DATE_SUFFIXES = { 1: "st", 2: "nd", 3: "rd" };

// Internal utility

function darkModeEnabled() {
	if (store) {
		const state = store.getState();
		return state && state.appConfig && state.appConfig.enableDarkMode;
	}

	return false;
}

function pad(n) {
	if (n < 10) {
		return "0" + n;
	}

	return "" + n;
}

// Generic

export function ucfirst(str) {
	var f = str.charAt(0).toUpperCase();
	return f + str.substr(1);
}

export function pluralize(value, base, addition) {
	// Example: 8, "banana", "s", returns either "banana" or "bananas"

	value = parseInt(value, 10);

	if (value === 1) {
		return base;
	}

	return base + addition;
}

// Time

export function formatTime(milliseconds) {
	var sec = Math.floor(milliseconds / 1000);

	var day = Math.floor(sec / 86400);
	sec = sec % 86400;

	var hour = Math.floor(sec / 3600);
	sec = sec % 3600;

	var min = Math.floor(sec / 60);
	sec = sec % 60;

	return { day, hour, min, sec };
}

export function minuteTime(timeStamp) {
	// Less granularity

	if (typeof timeStamp === "string") {
		return timeStamp.replace(/T([0-9]+:[0-9]+)([:.0-9]*)/, "T$1");
	}

	return timeStamp;
}

export function timeStampDate(timeStamp) {

	if (typeof timeStamp === "string") {
		return timeStamp.replace(/T.+/, "");
	}

	return timeStamp;
}

export function dateStamp(date) {
	const y = date.getFullYear();
	const m = date.getMonth();
	const d = date.getDate();

	return y + "-" + pad(m + 1) + "-" + pad(d);
}

export function timeStamp(date, displaySeconds = true) {
	const h = date.getHours();
	const m = date.getMinutes();

	const hm = pad(h) + ":" + pad(m);

	if (displaySeconds) {
		const s = date.getSeconds();
		return hm + ":" + pad(s);
	}

	return hm;
}

function getDateSuffix(dateNumber) {
	const lastDigit = ("" + dateNumber).substr(-1);

	if (DATE_SUFFIXES[lastDigit]) {
		return DATE_SUFFIXES[lastDigit];
	}

	return DEFAULT_DATE_SUFFIX;
}

export function humanDateStamp(date, displayYear = false, displayWeekday = false) {
	const m = date.getMonth();
	const d = date.getDate();
	const suffix = getDateSuffix(d);

	var out = MONTHS[m] + " " + d + suffix;

	if (displayYear) {
		const y = date.getFullYear();
		out = out + " " + y;
	}

	if (displayWeekday) {
		const wd = date.getDay();
		out = DAYS[wd] + ", " + out;
	}

	return out;
}

export function offsetDate(date, offsetDays) {
	const y  = date.getFullYear();
	const mo = date.getMonth();
	const d  = date.getDate();
	const h  = date.getHours();
	const mi = date.getMinutes();
	const s  = date.getSeconds();
	const ms = date.getMilliseconds();

	return new Date(y, mo, d + offsetDays, h, mi, s, ms);
}

export function nextDay(date) {
	return offsetDate(date, 1);
}

export function prevDay(date) {
	return offsetDate(date, -1);
}

export function midnightDate(date) {
	const y = date.getFullYear();
	const m = date.getMonth();
	const d = date.getDate();

	return new Date(y, m, d);
}

// Site specific

export function internalUrl(url) {
	return ROOT_PATHNAME + url;
}

function round2(n) {
	return Math.round(n * 100) / 100;
}

export function timeOpacity(secondsSince) {
	// Exponential fall
	const maxSeconds = 2*3600;
	const formula = 1/Math.pow(Math.pow(10, 1/(maxSeconds/2)), secondsSince);
	return Math.min(1, formula);
}

export function timeTextOpacity(secondsSince) {
	// Linear fall
	var minOpacity = 0.2, maxOpacity = 1;
	return Math.max(minOpacity, Math.min(maxOpacity, 29/25 - secondsSince/45000));
}

export function timeColors (milliseconds, color = ACTIVITY_COLOR_RGB) {
	const darkMode = darkModeEnabled();

	if (color === ACTIVITY_COLOR_RGB && darkMode) {
		color = DARKMODE_ACTIVITY_COLOR_RGB;
	}

	// Color
	var backgroundOpacity = round2(timeOpacity(milliseconds/1000)),
		textColor = darkMode ? DARKMODE_FG_COLOR : FG_COLOR,
		opacity = round2(timeTextOpacity(milliseconds/1000));

	if (backgroundOpacity >= 0.3) {
		textColor = darkMode ? DARKMODE_INVERTED_FG_COLOR : INVERTED_FG_COLOR;
	}

	return {
		backgroundColor: `rgba(${color},${backgroundOpacity})`,
		color: textColor,
		opacity
	};
}
