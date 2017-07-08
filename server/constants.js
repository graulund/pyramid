// PYRAMID
// Constants

const path = require("path");

const DATA_ROOT = path.join(__dirname, "..", "data");

module.exports = {
	DEBUG: false,
	FILE_ENCODING: "utf8",

	PROJECT_ROOT: path.join(__dirname, ".."),
	DATA_ROOT,
	LOG_ROOT: path.join(__dirname, "..", "public", "data", "logs"),

	DB_FILENAME: path.join(DATA_ROOT, "pyramid.db"),

	RELATIONSHIP_NONE: 0,
	RELATIONSHIP_FRIEND: 1,
	RELATIONSHIP_BEST_FRIEND: 2,

	CACHE_LINES: 150,
	CONTEXT_CACHE_LINES: 40,
	CONTEXT_CACHE_MINUTES: 60,
	LAST_SEEN_UPDATE_RATE: 500,
	LOG_PAGE_SIZE: 300,
	BUNCHED_EVENT_SIZE: 50,

	USER_MODIFYING_EVENT_TYPES:
		["join", "part", "quit", "kick", "kill", "mode"],
	PART_EVENT_TYPES:
		["part", "quit", "kick", "kill"],
	BUNCHABLE_EVENT_TYPES:
		["join", "part", "quit", "kill", "mode"],

	SUPPORTED_CATEGORY_NAMES: ["highlights", "allfriends", "system"],

	TOKEN_COOKIE_NAME: "token",
	TOKEN_COOKIE_SECONDS: 86400 * 365,

	PAGE_TYPES: {
		CATEGORY: "category",
		CHANNEL: "channel",
		USER: "user"
	},

	CONNECTION_STATUS: {
		ABORTED: "aborted",
		CONNECTED: "connected",
		DISCONNECTED: "disconnected",
		FAILED: "failed",
		REJECTED: "rejected"
	},

	CHANNEL_TYPES: {
		PUBLIC: 0,
		PRIVATE: 1
	},

	USER_EVENT_VISIBILITY: {
		OFF: 0,
		COLLAPSE_PRESENCE: 1,
		COLLAPSE_MESSAGES: 2,
		SHOW_ALL: 3
	},

	RETAIN_DB_TYPES: {
		LINES: 0,
		DAYS: 1
	}
};
