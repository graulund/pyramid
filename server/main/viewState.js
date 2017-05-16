const lodash = require("lodash");

var currentViewState = {};

const storeViewState = function(viewState) {
	currentViewState = lodash.assign({}, currentViewState, viewState);
};

module.exports = {
	currentViewState: () => currentViewState,
	storeViewState
};
