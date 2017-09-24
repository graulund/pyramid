import values from "lodash/values";

// Constants

export const VERSION = "1.0 prerelease";

export const DEFAULT_TIMEZONE = "UTC";
export const ROOT_PATHNAME = "";

export const CACHE_LINES = 150;
export const LOG_PAGE_SIZE = 300;

export const RELATIONSHIP_NONE = 0;
export const RELATIONSHIP_FRIEND = 1;
export const RELATIONSHIP_BEST_FRIEND = 2;

export const PAGE_TYPES = {
	CATEGORY: "category",
	CHANNEL: "channel",
	USER: "user"
};

export const PAGE_TYPE_NAMES = values(PAGE_TYPES);

export const CATEGORY_NAMES = {
	allfriends: "All friends",
	highlights: "Highlights",
	system: "System log"
};

export const SETTINGS_PAGE_NAMES = {
	general: "General",
	friends: "Friends",
	irc: "IRC",
	nicknames: "Nicknames",
	twitch: "Twitch"
};

export const CHANGE_DEBOUNCE_MS = 1300;
export const INPUT_SELECTOR = "input, select, textarea";

export const TWITCH_DISPLAY_NAMES = {
	OFF: 0,
	CASE_CHANGES_ONLY: 1,
	ALL: 2
};

export const ACTIVITY_COLOR_RGB = "0,0,51";
export const DARKMODE_ACTIVITY_COLOR_RGB = "119,187,238";
export const BG_COLOR = "#fff";
export const DARKMODE_BG_COLOR = "#2b2b33";
export const FG_COLOR = "#222227";
export const DARKMODE_FG_COLOR = "#ccc";
export const INVERTED_FG_COLOR = "#fff";
export const DARKMODE_INVERTED_FG_COLOR = "#222227";

export const COLOR_BLINDNESS = {
	OFF: 0,
	PROTANOPE: 1,
	DEUTERANOPE: 2,
	TRITANOPE: 3
};

export const CHANNEL_TYPES = {
	PUBLIC: 0,
	PRIVATE: 1
};

export const TWITCH_CHEER_DISPLAY = {
	OFF: 0,
	STATIC: 1,
	ANIMATED: 2
};

export const USER_EVENT_VISIBILITY = {
	OFF: 0,
	COLLAPSE_PRESENCE: 1,
	COLLAPSE_MESSAGES: 2,
	SHOW_ALL: 3
};

export const RESTRICTED_APP_CONFIG_PROPERTIES = [
	"debug",
	"httpsCertPath",
	"httpsKeyPath",
	"logLinesFile",
	"restrictedChannelsLimit",
	"restrictedConnectionsLimit",
	"restrictedFriendsLimit",
	"restrictedMessagesPerSecondLimit",
	"restrictedMode",
	"restrictedNicknamesLimit",
	"restrictedServersLimit",
	"retainDbType",
	"retainDbValue",
	"strongIrcPasswordEncryption",
	"webHostname",
	"webPort"
];
