import actions from "../actions";
import store from "../store";
import pull from "lodash/pull";

import { CACHE_LINES } from "../constants";

var cacheLinesSetting = CACHE_LINES;

function handleNewCacheLinesSetting(value) {
	let fixedValue = parseInt(value, 10);

	if (
		isNaN(fixedValue) ||
		fixedValue < 20 ||
		fixedValue > 500
	) {
		fixedValue = CACHE_LINES;
	}

	if (fixedValue !== value) {
		store.dispatch(actions.appConfig.update({ cacheLines: fixedValue }));
	}

	if (fixedValue !== cacheLinesSetting) {
		cacheLinesSetting = fixedValue;
	}
}

export function cacheItem(cache, item, maxLines) {
	// Add it, or them
	if (item) {
		if (item instanceof Array) {
			cache = cache.concat(item);
		} else {
			cache = [ ...cache, item ];
		}
	}

	// And make sure we only have the maximum amount
	if (cache.length > maxLines) {
		cache = cache.slice(cache.length - maxLines);
	}

	return cache;
}

export function cacheMessageItem(cache, item) {
	return cacheItem(cache, item, cacheLinesSetting);
}

export function clearReplacedIdsFromCache(cache, prevIds) {
	if (cache && cache.length && prevIds && prevIds.length) {
		const itemsWithPrevIds = cache.filter(
			(item) => prevIds.indexOf(item.lineId) >= 0
		);
		return pull(cache, ...itemsWithPrevIds);

		// NOTE: We are modifiying in place to prevent too many change handlers from
		// occuring. We are expecting the caller to create a new array with an added
		// item immediately after having called this method.
	}

	return cache;
}

export function initializeMessageCaches() {
	// Look for new cache lines setting
	const importStateValue = function() {
		let state = store.getState();
		let storedConfigValue = state.appConfig.cacheLines;

		if (storedConfigValue && storedConfigValue !== cacheLinesSetting) {
			handleNewCacheLinesSetting(storedConfigValue);
		}
	};

	importStateValue();
	store.subscribe(importStateValue);
}
