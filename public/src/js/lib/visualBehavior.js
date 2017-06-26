import actions from "../actions";
import store from "../store";

export function isMobile() {
	return window.innerWidth < 768;
}

export function scrollToTheTop() {
	window.scrollTo(0, 0);
}

export function areWeScrolledToTheBottom() {
	let contentHeight = document.getElementById("container").clientHeight;
	let windowHeight = window.innerHeight;

	let scrollTop = window.pageYOffset ||
		document.documentElement.scrollTop ||
		document.body.scrollTop ||
		0;

	return (contentHeight - (scrollTop + windowHeight)) <= 100 ||
		windowHeight >= contentHeight;
}

export function scrollToTheBottom() {
	window.scrollTo(0, document.getElementById("container").clientHeight);
}

export function stickToTheBottom() {
	if (areWeScrolledToTheBottom()) {
		scrollToTheBottom();
	}
	else {
		// TODO: If you're *not* scrolled to the bottom, scroll UP
		// by a specific amount, so it looks like the content is
		// not moving

		// Plus, add a notice that there's new content?
	}
}

function initTouchDeviceTest() {
	window.addEventListener("touchstart", function onFirstTouch() {
		store.dispatch(actions.deviceState.update({ isTouchDevice: true }));
		window.removeEventListener("touchstart", onFirstTouch, false);
	}, false);
}

export function initVisualBehavior() {
	initTouchDeviceTest();
	initFocusHandler();
	patchSFFontIssues();
}

function getFocus() {
	var inFocus;

	try {
		inFocus = document.hasFocus();
	} catch(e){} // eslint-disable-line no-empty

	if (typeof inFocus !== "boolean") {
		// Assume we are
		return true;
	}

	return inFocus;
}

function getVisibility() {
	let visible = !document.hidden;

	if (typeof visible !== "boolean") {
		// Assume it is
		return true;
	}

	return visible;
}

function setFocus(inFocus) {
	let state = store.getState();
	let changes = {};
	let changed = false;
	let visible = getVisibility();

	if (state && state.deviceState.inFocus !== inFocus) {
		changes.inFocus = inFocus;
		changed = true;
	}

	if (state && state.deviceState.visible !== visible) {
		changes.visible = visible;
		changed = true;
	}

	if (changed) {
		store.dispatch(actions.deviceState.update(changes));
	}
}

function visibilityChangeHandler() {
	setFocus(getFocus());
}

function focusHandler() {
	setFocus(true);
}

function blurHandler() {
	setFocus(false);
}

function initFocusHandler() {
	visibilityChangeHandler();
	window.addEventListener("visibilitychange", visibilityChangeHandler);
	window.addEventListener("focus", focusHandler);
	window.addEventListener("blur", blurHandler);
}

export function setDarkModeStatus(status) {
	let list = document.body.classList;
	let name = "darkmode";
	if (status && !list.contains(name)) {
		list.add(name);
	}
	else if (!status && list.contains(name)) {
		list.remove(name);
	}
}

function patchSFFontIssues() {
	let ua = navigator.userAgent;
	let osMatch = ua.match(/Mac OS X 10_([0-9]+)/);
	let osVersion = osMatch && osMatch[1] && parseInt(osMatch[1], 10);

	if (osVersion && osVersion >= 11) {
		// >= macOS 10.11, we assume SF font

		// General
		document.body.classList.add("sf-font");

		// Issue with chrome
		if (/Chrome\//.test(ua)) {
			document.body.classList.add("chrome-sf-font");
		}
	}
}
