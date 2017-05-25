const constants = require("../constants");

const isJoinEvent = function(event) {
	return event && event.type === "join";
};

const isPartEvent = function(event) {
	return event && constants.PART_EVENT_TYPES.indexOf(event.type) >= 0;
};

module.exports = {
	isJoinEvent,
	isPartEvent
};
