import actions from "../actions";
import store from "../store";

export function areWeScrolledToTheBottom() {
	// Are we scrolled to the bottom?

	// --> Elements that have heights and offsets that matter
	let b = document.documentElement;
	let w = window;
	let c = document.getElementById("container");

	// --> Two oft-used heights
	let ch = c.clientHeight;
	let wh = w.innerHeight;

	// --> The calculation!
	return (ch - (b.scrollTop + wh)) <= 100 || wh >= ch;
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
}

function getFocus () {
	var inFocus;

	try {
		inFocus = document.hasFocus() && !window.hidden;
	} catch(e){} // eslint-disable-line no-empty

	if (typeof inFocus !== "boolean") {
		// Assume we are
		return true;
	}

	return inFocus;
}

function setFocus(inFocus) {
	const state = store.getState();
	if (state && state.deviceState.inFocus !== inFocus) {
		store.dispatch(actions.deviceState.update({ inFocus }));
	}
}

function focusChangeHandler() {
	setFocus(getFocus());
}

function focusHandler() {
	setFocus(true);
}

function blurHandler() {
	setFocus(false);
}

function initFocusHandler() {
	window.addEventListener("visibilitychange", focusChangeHandler);
	window.addEventListener("focus", focusHandler);
	window.addEventListener("blur", blurHandler);
}
