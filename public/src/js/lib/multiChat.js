import actions from "../actions";
import store from "../store";

function getCurrentData() {
	let state = store.getState();
	let { viewState: { currentLayout, currentLayoutFocus } } = state;
	return { currentLayout, currentLayoutFocus };
}

export function setFocus(index) {
	store.dispatch(actions.viewState.update({ currentLayoutFocus: index }));
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
