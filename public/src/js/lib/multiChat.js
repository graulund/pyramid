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

export function getCurrentDimensions() {
	let { currentLayout } = getCurrentData();

	let width = 0, height = 0;

	if (currentLayout) {
		currentLayout.forEach((item) => {
			let { columnEnd, columnStart, rowEnd, rowStart } = item;
			let x = columnEnd || columnStart;
			let y = rowEnd || rowStart;

			if (x > width) {
				width = x;
			}

			if (y > height) {
				height = y;
			}
		});
	}

	return { width, height };
}

export function removeFrame(index) {
	console.log("removeFrame", index); // TODO
}

export function addFrameToTheLeft(index) {
	console.log("addFrameToTheLeft", index); // TODO
}

export function addFrameToTheRight(index) {
	console.log("addFrameToTheRight", index); // TODO
}

export function addFrameAbove(index) {
	console.log("addFrameAbove", index); // TODO
}

export function addFrameBelow(index) {
	console.log("addFrameBelow", index); // TODO
}
