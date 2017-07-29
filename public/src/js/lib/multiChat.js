import { updateMultiChatVisibility } from "./dataExpiration";
import { homeUrl } from "./routeHelpers";
import actions from "../actions";
import store from "../store";

function rangesOverlap(x1, x2, y1, y2) {
	var low1, low2, high1, high2;
	if (x1 <= y1) {
		low1 = x1;
		low2 = x2;
		high1 = y1;
		high2 = y2;
	}
	else {
		low1 = y1;
		low2 = y2;
		high1 = x1;
		high2 = x2;
	}

	return low1 <= high2 && high1 <= low2;
}

export function getCurrentData() {
	let state = store.getState();
	let { viewState: { currentLayout, currentLayoutFocus } } = state;
	return { currentLayout, currentLayoutFocus };
}

function unitItem(item) {
	return {
		...item,
		columnStart: 1,
		columnEnd: 2,
		rowStart: 1,
		rowEnd: 2
	};
}

function getNewLayoutFromPage(page) {
	return [unitItem(page || {})];
}

function updateViewState(data) {
	let { currentLayout: newLayout } = data;

	if (newLayout) {
		let { currentLayout } = getCurrentData();

		if (currentLayout) {
			updateMultiChatVisibility(false, currentLayout);
		}

		updateMultiChatVisibility(true, newLayout);

		if (localStorage) {
			localStorage.currentLayout = JSON.stringify(newLayout);
		}
	}

	store.dispatch(actions.viewState.update(data));
}

function updateCurrentLayout(data) {
	updateViewState({ currentLayout: data });
}

export function importLayoutFromLocalStorage() {
	if (localStorage && localStorage.currentLayout) {
		try {
			let currentLayout = JSON.parse(localStorage.currentLayout);
			updateViewState({ currentLayout });
		}

		catch (e) {
			localStorage.currentLayout = JSON.stringify(null);
		}
	}
}

export function setFocus(index) {
	let { currentLayout } = getCurrentData();
	index = Math.min(currentLayout.length - 1, index);
	updateViewState({ currentLayoutFocus: index });
}

export function clearCurrentLayout() {
	updateViewState({ currentLayout: [], currentLayoutFocus: 0 });
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

function getDimensions(layout) {
	let width = 1, height = 1, originX = null, originY = null;

	if (layout) {
		layout.forEach((item) => {
			let { columnEnd, columnStart, rowEnd, rowStart } = item;

			if (columnEnd > width) {
				width = columnEnd;
			}

			if (originX === null || columnStart < originX) {
				originX = columnStart;
			}

			if (rowEnd > height) {
				height = rowEnd;
			}

			if (originY === null || rowStart < originY) {
				originY = rowStart;
			}
		});

		// Width and height are the highest starting values, not ending values
		width = Math.max(1, width - 1);
		height = Math.max(1, height - 1);
	}

	else {
		originX = 1;
		originY = 1;
	}

	return { width, height, originX, originY };
}

export function getCurrentDimensions() {
	let { currentLayout } = getCurrentData();
	return getDimensions(currentLayout);
}

export function hasEmptySpaceInDirection(index, xDirection, yDirection) {
	let { currentLayout } = getCurrentData();
	let { width, height } = getCurrentDimensions();

	let item = currentLayout[index];

	if (!item) {
		return false;
	}

	let { columnEnd, columnStart, rowEnd, rowStart } = item;
	let start = null, end = null;

	if (xDirection > 0) {
		start = columnEnd - 1;
		end = width;
	}

	else if (xDirection < 0) {
		start = 1;
		end = columnStart;
	}

	else if (yDirection > 0) {
		start = rowEnd - 1;
		end = height;
	}

	else if (yDirection < 0) {
		start = 1;
		end = rowStart;
	}

	else {
		return false;
	}

	if (start === end) {
		return false;
	}

	let horizontal = xDirection !== 0;
	let vertical = yDirection !== 0;
	let space = end - start;

	currentLayout.forEach((item, i) => {
		if (
			(
				// Looking in the vertical direction only
				vertical &&
				!rangesOverlap(
					columnStart,
					columnEnd - 1,
					item.columnStart,
					item.columnEnd - 1
				)
			) ||
			(
				// Looking in the horizontal direction only
				horizontal &&
				!rangesOverlap(
					rowStart,
					rowEnd - 1,
					item.rowStart,
					item.rowEnd - 1
				)
			) ||
			index === i
		) {
			// Disregard
			return;
		}

		if (horizontal) {
			if (item.columnStart >= start && (item.columnEnd - 1) <= end) {
				space -= item.columnEnd - item.columnStart;
			}
		}

		else if (vertical) {
			if (item.rowStart >= start && (item.rowEnd - 1) <= end) {
				space -= item.rowEnd - item.rowStart;
			}
		}
	});

	return space > 0;
}

export function hasEmptySpaceToTheLeft(index) {
	return hasEmptySpaceInDirection(index, -1, 0);
}

export function hasEmptySpaceToTheRight(index) {
	return hasEmptySpaceInDirection(index, 1, 0);
}

export function hasEmptySpaceAbove(index) {
	return hasEmptySpaceInDirection(index, 0, -1);
}

export function hasEmptySpaceBelow(index) {
	return hasEmptySpaceInDirection(index, 0, 1);
}

function fixOrigin(layout) {
	let { originX, originY } = getDimensions(layout);

	if (originX !== 1 || originY !== 1) {
		layout = layout.map((item) => {
			let {
				columnEnd,
				columnStart,
				rowEnd,
				rowStart
			} = item;

			return {
				...item,
				columnEnd: columnEnd - (originX - 1),
				columnStart: columnStart - (originX - 1),
				rowEnd: rowEnd - (originY - 1),
				rowStart: rowStart - (originY - 1)
			};
		});
	}

	return layout;
}

export function removeFrame(index) {
	let { currentLayout, currentLayoutFocus } = getCurrentData();
	let newLayout = [ ...currentLayout ];
	newLayout.splice(index, 1);

	// Pull items back if we get new empty spaces
	newLayout = fixOrigin(newLayout);

	let newFocus = currentLayoutFocus === index ? 0 : currentLayoutFocus;
	updateViewState({ currentLayout: newLayout, currentLayoutFocus: newFocus });

	return newLayout;
}

export function removeOtherFrames(index) {
	let { currentLayout } = getCurrentData();
	let item = unitItem(currentLayout[index]);
	updateViewState({ currentLayout: [item], currentLayoutFocus: 0 });
}

function updateLayoutWithAddition(newLayout, newIndex, xDiff, yDiff, isDelta) {
	// Push canvas if we go out of it

	newLayout = fixOrigin(newLayout);
	let newItem = newLayout[newIndex];
	let x = newItem.columnStart;
	let y = newItem.rowStart;
	let width = newItem.columnEnd - newItem.columnStart;
	let height = newItem.rowEnd - newItem.rowStart;

	// Correct overlapping items that need to be pushed

	let horizontal = xDiff !== 0;
	let vertical = yDiff !== 0;

	let isOverlapping = newLayout.filter((item, index) => {
		return index !== newIndex &&
			rangesOverlap(x, x + width - 1, item.columnStart, item.columnEnd - 1) &&
			rangesOverlap(y, y + height - 1, item.rowStart, item.rowEnd - 1);
	}).length > 0;

	if (isOverlapping) {
		let pushItems = function(
			positionValue,
			sizeValue,
			startName,
			endName,
			difference
		) {
			let direction = Math.max(-1, Math.min(1, difference));
			return function(item, i) {
				if (
					(
						vertical &&
						!rangesOverlap(
							x,
							x + width - 1,
							item.columnStart,
							item.columnEnd - 1
						)
					) ||
					(
						horizontal &&
						!rangesOverlap(
							y,
							y + height - 1,
							item.rowStart,
							item.rowEnd - 1
						)
					) ||
					newIndex === i
				) {
					// Disregard
					return item;
				}

				let start = item[startName];
				let end = item[endName];

				if (
					direction > 0 && start >= positionValue ||
					direction < 0 && start <= positionValue
				) {
					let newStart = start + direction * sizeValue;
					let newEnd = end + direction * sizeValue;

					return {
						...item,
						[startName]: newStart,
						[endName]: newEnd
					};
				}

				return item;
			};
		};

		if (horizontal) {
			newLayout = newLayout.map(pushItems(
				x,
				isDelta ? xDiff : width,
				"columnStart",
				"columnEnd",
				xDiff
			));
		}

		if (vertical) {
			newLayout = newLayout.map(pushItems(
				y,
				isDelta ? yDiff : height,
				"rowStart",
				"rowEnd",
				yDiff
			));
		}

		newLayout = fixOrigin(newLayout);
	}

	updateViewState({ currentLayout: newLayout, currentLayoutFocus: newIndex });
}

export function addFrame(index, page, xDiff, yDiff) {
	let { currentLayout } = getCurrentData();
	let item = currentLayout && currentLayout[index];
	let newLayout = null;

	if (!item) {
		newLayout = getNewLayoutFromPage(page);
		item = newLayout[0];
	}

	else {
		newLayout = [ ...currentLayout ];
	}

	let horizontal = xDiff !== 0;
	let vertical = yDiff !== 0;

	let width = horizontal ? 1 : item.columnEnd - item.columnStart;
	let height = vertical ? 1 : item.rowEnd - item.rowStart;

	// New coordinates

	let x = xDiff > 0
		? item.columnEnd - 1 + xDiff
		: item.columnStart + xDiff * width;

	let y = yDiff > 0
		? item.rowEnd - 1 + yDiff
		: item.rowStart + yDiff * height;

	// Insert the new item

	let newIndex = newLayout.length;

	newLayout.push({
		columnStart: x,
		columnEnd: x + width,
		rowStart: y,
		rowEnd: y + height
	});

	updateLayoutWithAddition(newLayout, newIndex, xDiff, yDiff, false);
}

export function changeFrameSize(index, xDiff, yDiff, xDirection, yDirection) {
	let { currentLayout } = getCurrentData();
	let item = currentLayout && currentLayout[index];
	let newLayout = [ ...currentLayout ];

	if (xDiff !== 0) {
		if (xDirection > 0) {
			// Rightwards
			item = {
				...item,
				columnEnd: Math.max(item.columnStart, item.columnEnd + xDiff)
			};
		}

		else if (xDirection < 0) {
			// Leftwards
			item = {
				...item,
				columnStart: Math.min(item.columnEnd, item.columnStart - xDiff)
			};
		}
	}

	if (yDiff !== 0) {
		if (yDirection > 0) {
			// Downwards
			item = {
				...item,
				rowEnd: Math.max(item.rowStart, item.rowEnd + yDiff)
			};
		}

		else if (yDirection < 0) {
			// Upwards
			item = {
				...item,
				rowStart: Math.min(item.rowEnd, item.rowStart - yDiff)
			};
		}
	}

	newLayout[index] = item;

	if (xDiff > 0 || yDiff > 0) {
		// Expand
		updateLayoutWithAddition(
			newLayout,
			index,
			xDiff * xDirection,
			yDiff * yDirection,
			true
		);
	}

	else {
		// Contract
		newLayout = fixOrigin(newLayout);
		updateCurrentLayout(newLayout);
	}
}

export function addFrameToTheLeft(index, page) {
	addFrame(index, page, -1, 0);
}

export function addFrameToTheRight(index, page) {
	addFrame(index, page, 1, 0);
}

export function addFrameAbove(index, page) {
	addFrame(index, page, 0, -1);
}

export function addFrameBelow(index, page) {
	addFrame(index, page, 0, 1);
}

export function expandFrameToTheLeft(index) {
	changeFrameSize(index, 1, 0, -1, 0);
}

export function expandFrameToTheRight(index) {
	changeFrameSize(index, 1, 0, 1, 0);
}

export function expandFrameUp(index) {
	changeFrameSize(index, 0, 1, 0, -1);
}

export function expandFrameDown(index) {
	changeFrameSize(index, 0, 1, 0, 1);
}

export function contractFrameFromTheLeft(index) {
	changeFrameSize(index, -1, 0, -1, 0);
}

export function contractFrameFromTheRight(index) {
	changeFrameSize(index, -1, 0, 1, 0);
}

export function contractFrameFromAbove(index) {
	changeFrameSize(index, 0, -1, 0, -1);
}

export function contractFrameFromBelow(index) {
	changeFrameSize(index, 0, -1, 0, 1);
}

export function maximumDimensionsForViewport() {
	return {
		width: Math.floor((window.innerWidth - 320) / 300),
		height: Math.floor(window.innerHeight / 240)
	};
}
