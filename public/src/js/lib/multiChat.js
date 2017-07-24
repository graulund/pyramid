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
	let { currentLayout, currentLayoutFocus } = getCurrentData();
	let newLayout = [ ...currentLayout ];
	newLayout.splice(index, 1);

	let newFocus = currentLayoutFocus === index ? 0 : currentLayoutFocus;
	updateViewState({ currentLayout: newLayout, currentLayoutFocus: newFocus });
}

export function addFrame(index, xDiff, yDiff, width = 0, height = 0) {
	let { currentLayout } = getCurrentData();
	let item = currentLayout[index];

	if (!item) {
		return;
	}

	let newLayout = [ ...currentLayout ];

	// New coordinates

	let x = Math.max(
		0,
		xDiff > 0
			? item.columnEnd + xDiff
			: item.columnStart + xDiff * (1 + width)
	);
	let y = Math.max(
		0,
		yDiff > 0
			? item.rowEnd + yDiff
			: item.rowStart + yDiff * (1 + height)
	);

	// Correct already existing items that need to be pushed

	let pushItems = function(
		positionValue,
		sizeValue,
		startName,
		endName
	) {
		return function(item) {
			let start = item[startName];
			let end = item[endName];

			if (start >= positionValue) {
				let newStart = start + (1 + sizeValue);
				let newEnd = end + (1 + sizeValue);

				return {
					...item,
					[startName]: newStart,
					[endName]: newEnd
				};
			}

			return item;
		};
	};

	if (xDiff !== 0) {
		newLayout = newLayout.map(
			pushItems(x, width, "columnStart", "columnEnd")
		);
	}

	if (yDiff !== 0) {
		newLayout = newLayout.map(
			pushItems(y, height, "rowStart", "rowEnd")
		);
	}

	// TODO: Need to "pull items" back, too, on removal

	// Insert the new item

	newLayout.push({
		columnStart: x,
		columnEnd: x + width,
		rowStart: y,
		rowEnd: y + height
	});

	updateCurrentLayout(newLayout);
}

export function addFrameToTheLeft(index) {
	addFrame(index, -1, 0);
}

export function addFrameToTheRight(index) {
	addFrame(index, 1, 0);
}

export function addFrameAbove(index) {
	addFrame(index, 0, -1);
}

export function addFrameBelow(index) {
	addFrame(index, 0, 1);
}

export function maximumDimensionsForViewport() {
	return {
		width: Math.floor((window.innerWidth - 320) / 300),
		height: Math.floor(window.innerHeight / 240)
	};
}
