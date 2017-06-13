const _ = require("lodash");

var currentViewState = {};

const storeViewState = function(viewState) {
	currentViewState = _.assign({}, currentViewState, viewState);
};

module.exports = {
	currentViewState: () => currentViewState,
	storeViewState
};
