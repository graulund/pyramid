/*eslint no-undef: 0*/
import { createStore, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";

import sagas from "./sagas";
import reducers from "./reducers/index";

var composeWithDevTools;

if (__DEV__) {
	composeWithDevTools = require("redux-devtools-extension").composeWithDevTools;
}

var sagaMiddleware = createSagaMiddleware();
var store = createStore(
	reducers,
	composeWithDevTools
		? composeWithDevTools(
			applyMiddleware(sagaMiddleware)
		)
		: applyMiddleware(sagaMiddleware)
);

if (sagas) {
	sagas.forEach((saga) => sagaMiddleware.run(saga));
}

export default store;
