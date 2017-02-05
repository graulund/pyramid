// PYRAMID
// Constants

const path = require("path");

module.exports = {
	LOG_ROOT: path.join(__dirname, "..", "public", "data", "logs"),

	RELATIONSHIP_NONE: 0,
	RELATIONSHIP_FRIEND: 1,
	RELATIONSHIP_BEST_FRIEND: 2,

	CACHE_LINES: 150,
	LAST_SEEN_UPDATE_RATE: 500,

	USER_MODIFYING_EVENT_TYPES:
		["join", "part", "quit", "kick", "kill", "+mode", "-mode"],
	PART_EVENT_TYPES:
		["part", "quit", "kick", "kill"],
	BUNCHABLE_EVENT_TYPES:
		["join", "part", "quit", "kill", "+mode", "-mode"],

	SUPPORTED_CATEGORY_NAMES: ["highlights", "allfriends"],

	TOKEN_COOKIE_NAME: "token",
	TOKEN_COOKIE_SECONDS: 86400 * 365
};
