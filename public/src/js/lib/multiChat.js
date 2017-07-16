import { homeUrl } from "./routeHelpers";
import actions from "../actions";
import store from "../store";

function getCurrentData() {
	let state = store.getState();
	let { viewState: { currentLayout, currentLayoutFocus } } = state;
	return { currentLayout, currentLayoutFocus };
}

function updateViewState(data) {
	store.dispatch(actions.viewState.update(data));
}

function updateCurrentLayout(data) {
	updateViewState({ currentLayout: data });
}

export function setFocus(index) {
	updateViewState({ currentLayoutFocus: index });
}

export function shiftFocus(offset) {
	let { currentLayout, currentLayoutFocus } = getCurrentData();
	let newIndex;

	if (!currentLayout || !currentLayout.length) {
		newIndex = 0;
	}

	else {
		newIndex = (currentLayoutFocus + offset) % currentLayout.length;

		while (newIndex < 0) {
			newIndex = currentLayout.length + newIndex;
		}
	}

	setFocus(newIndex);
}

export function setView(index, type, query, logDate, pageNumber) {
	let { currentLayout } = getCurrentData();
	let current = currentLayout[index];
	let layout = [...currentLayout];
	layout[index] = { ...current, type, query, logDate, pageNumber };
	updateCurrentLayout(layout);
}

export function setViewInCurrent(type, query, logDate, pageNumber) {
	let { currentLayoutFocus } = getCurrentData();
	if (typeof currentLayoutFocus === "number") {
		setView(currentLayoutFocus, type, query, logDate, pageNumber);
		return true;
	}

	return false;
}

export function locationIsMultiChat(location) {
	// Only front page for now
	return location.pathname === homeUrl;
}
