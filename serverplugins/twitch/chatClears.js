/*
const _ = require("lodash");

const stringUtils = require("../../server/util/strings");

const SECONDS_RECENT = 5;

var recentChatClears = [];

function updateRecents(newMessage) {
	let ago = new Date(new Date().getTime() - SECONDS_RECENT * 1000);
	recentChatClears.push(newMessage);
	recentChatClears = recentChatClears.filter((m) => m.time >= ago);
}

function hasDuplicate(message) {
	return !!recentChatClears.find((m) => _.isEqual(m, message));
}

function onClearChat(message) {

	if (hasDuplicate(message)) {
		// Duplicate
		updateRecents(message);
		return null;
	}

	let duration = message.tags && message.tags["ban-duration"];
	let reason = message.tags && message.tags["ban-reason"];
	let clearedUsername = message.params[1] || "";

	if (!clearedUsername) {
		// No user (invalid, don't store)
		updateRecents();
		return null;
	}

	let announcement = duration && duration > 0
		? `${clearedUsername} has been timed out for ${duration} ` +
			stringUtils.pluralize(duration, "second", "s")
		: `${clearedUsername} has been banned`;

	let line = reason
		? announcement + ": " + reason
		: announcement + ".";

	updateRecents(message);
	return { clearedUsername, line };
}

module.exports = {
	onClearChat
};
*/
