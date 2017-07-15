import actions from "../actions";
import store from "../store";

export function setFocus(index) {
	store.dispatch(actions.viewState.update({ currentLayoutFocus: index }));
}
