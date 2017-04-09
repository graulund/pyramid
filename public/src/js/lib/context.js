
function getFocus () {
	var inFocus;

	try {
		inFocus = document.hasFocus() && !window.hidden;
	} catch(e){}

	if (typeof inFocus !== "boolean") {
		// Assume we are
		return true;
	}

	return inFocus;
}

function setFocus (focus) {
	if (config.get("inFocus") !== focus) {
		config.set("inFocus", focus);
	}
}

function focusChangeHandler(evt) {
	setFocus(getFocus());
}

function focusHandler () {
	setFocus(true);
}

function blurHandler () {
	setFocus(false);
}

export function initializeFocusHandlers () {
	window.addEventListener("visibilitychange", focusChangeHandler);
	window.addEventListener("focus", focusHandler);
	window.addEventListener("blur", blurHandler);
}

export function initializeContext () {
	initializeFocusHandlers();
}
