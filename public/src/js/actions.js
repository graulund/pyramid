import * as actionTypes from "./actionTypes";

export default {
	appConfig: {
		update(data) {
			return {
				type: actionTypes.appConfig.UPDATE,
				data
			};
		}
	},
	categoryCaches: {
		append(data) {
			return {
				type: actionTypes.categoryCaches.APPEND,
				data
			};
		},
		update(data) {
			return {
				type: actionTypes.categoryCaches.UPDATE,
				data
			};
		}
	},
	channelCaches: {
		append(data) {
			return {
				type: actionTypes.channelCaches.APPEND,
				data
			};
		},
		update(data) {
			return {
				type: actionTypes.channelCaches.UPDATE,
				data
			};
		}
	},
	channelUserLists: {
		update(data) {
			return {
				type: actionTypes.channelUserLists.UPDATE,
				data
			};
		}
	},
	friendsList: {
		set(data) {
			return {
				type: actionTypes.friendsList.SET,
				data
			};
		},
		update(level, data) {
			return {
				type: actionTypes.friendsList.UPDATE,
				level,
				data
			};
		}
	},
	ircConfigs: {
		set(data) {
			return {
				type: actionTypes.ircConfigs.SET,
				data
			};
		},
		update(data) {
			return {
				type: actionTypes.ircConfigs.UPDATE,
				data
			};
		}
	},
	lastSeenChannels: {
		update(data) {
			return {
				type: actionTypes.lastSeenChannels.UPDATE,
				data
			};
		}
	},
	lastSeenUsers: {
		update(data) {
			return {
				type: actionTypes.lastSeenUsers.UPDATE,
				data
			};
		}
	},
	lineInfo: {
		update(data) {
			return {
				type: actionTypes.lineInfo.UPDATE,
				data
			};
		}
	},
	logDetails: {
		update(data) {
			return {
				type: actionTypes.logDetails.UPDATE,
				data
			};
		}
	},
	logFiles: {
		clear(channel, date) {
			return {
				type: actionTypes.logFiles.CLEAR,
				channel,
				date
			};
		},
		update(data) {
			return {
				type: actionTypes.logFiles.UPDATE,
				data
			};
		}
	},
	multiServerChannels: {
		set(data) {
			return {
				type: actionTypes.multiServerChannels.SET,
				data
			};
		}
	},
	nicknames: {
		set(data) {
			return {
				type: actionTypes.nicknames.SET,
				data
			};
		},
		update(data) {
			return {
				type: actionTypes.nicknames.UPDATE,
				data
			};
		}
	},
	token: {
		set(data) {
			return {
				type: actionTypes.token.SET,
				data
			};
		}
	},
	unseenHighlights: {
		set(data) {
			return {
				type: actionTypes.unseenHighlights.SET,
				data
			};
		}
	},
	userCaches: {
		append(data) {
			return {
				type: actionTypes.userCaches.APPEND,
				data
			};
		},
		update(data) {
			return {
				type: actionTypes.userCaches.UPDATE,
				data
			};
		}
	},
	viewState: {
		update(data) {
			return {
				type: actionTypes.viewState.UPDATE,
				data
			};
		}
	}
};
