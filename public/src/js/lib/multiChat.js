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

function getDimensions(layout) {
	let width = 0, height = 0, originX = null, originY = null;

	if (layout) {
		layout.forEach((item) => {
			let { columnEnd, columnStart, rowEnd, rowStart } = item;
			let x = columnEnd || columnStart;
			let y = rowEnd || rowStart;

			if (x > width) {
				width = x;
			}

			if (originX === null || x < originX) {
				originX = x;
			}

			if (y > height) {
				height = y;
			}

			if (originY === null || y < originY) {
				originY = y;
			}
		});
	}

	let out = {
		height,
		originX,
		originY,
		width
	};

	return out;
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
		start = columnEnd;
		end = width;
	}

	else if (xDirection < 0) {
		start = 1;
		end = columnStart;
	}

	else if (yDirection > 0) {
		start = rowEnd;
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
					columnEnd,
					item.columnStart,
					item.columnEnd
				)
			) ||
			(
				// Looking in the horizontal direction only
				horizontal &&
				!rangesOverlap(
					rowStart,
					rowEnd,
					item.rowStart,
					item.rowEnd
				)
			) ||
			index === i
		) {
			// Disregard
			return;
		}

		if (horizontal) {
			if (item.columnStart >= start && item.columnEnd <= end) {
				space -= 1 + item.columnEnd - item.columnStart;
			}
		}

		else if (vertical) {
			if (item.rowStart >= start && item.rowEnd <= end) {
				space -= 1 + item.rowEnd - item.rowStart;
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
}

export function addFrame(index, xDiff, yDiff) {
	let { currentLayout } = getCurrentData();
	let item = currentLayout[index];

	if (!item) {
		return;
	}

	let width = item.columnEnd - item.columnStart;
	let height = item.rowEnd - item.rowStart;
	let newLayout = [ ...currentLayout ];

	// New coordinates

	let x = xDiff > 0
		? item.columnEnd + xDiff
		: item.columnStart + xDiff * (1 + width);

	let y = yDiff > 0
		? item.rowEnd + yDiff
		: item.rowStart + yDiff * (1 + height);

	let horizontal = xDiff !== 0;
	let vertical = yDiff !== 0;

	// Insert the new item

	let newIndex = newLayout.length;

	newLayout.push({
		columnStart: x,
		columnEnd: x + width,
		rowStart: y,
		rowEnd: y + height
	});

	// Push canvas if we go out of it

	newLayout = fixOrigin(newLayout);
	x = newLayout[newIndex].columnStart;
	y = newLayout[newIndex].rowStart;

	// Correct overlapping items that need to be pushed

	let isOverlapping = newLayout.filter((item, index) => {
		return index !== newIndex &&
			rangesOverlap(x, x + width, item.columnStart, item.columnEnd) &&
			rangesOverlap(y, y + height, item.rowStart, item.rowEnd);
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
							x + width,
							item.columnStart,
							item.columnEnd
						)
					) ||
					(
						horizontal &&
						!rangesOverlap(
							y,
							y + height,
							item.rowStart,
							item.rowEnd
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
					let newStart = start + direction * (1 + sizeValue);
					let newEnd = end + direction * (1 + sizeValue);

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
				width,
				"columnStart",
				"columnEnd",
				xDiff
			));
		}

		if (vertical) {
			newLayout = newLayout.map(pushItems(
				y,
				height,
				"rowStart",
				"rowEnd",
				yDiff
			));
		}

		newLayout = fixOrigin(newLayout);
	}

	updateViewState({ currentLayout: newLayout, currentLayoutFocus: newIndex });
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
