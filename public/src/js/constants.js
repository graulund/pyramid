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

export const DEFAULT_COLOR_RGB = "0,0,51";
export const DEFAULT_DARKMODE_COLOR_RGB = "119,187,238";
export const DEFAULT_BG_COLOR = "#ffffff";
export const DEFAULT_DARKMODE_BG_COLOR = "#2b2b33";

export const COLOR_BLINDNESS = {
	OFF: 0,
	PROTANOPE: 1,
	DEUTERANOPE: 2,
	TRITANOPE: 3
};
