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

		update(categoryName, cache) {
			return {
				type: actionTypes.categoryCaches.UPDATE,
				categoryName,
				cache
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

		update(channel, cache) {
			return {
				type: actionTypes.channelCaches.UPDATE,
				channel,
				cache
			};
		},

		remove(channel) {
			return {
				type: actionTypes.channelCaches.REMOVE,
				channel
			};
		},

		clearUser(channel, username, time) {
			return {
				type: actionTypes.channelCaches.CLEARUSER,
				channel,
				time,
				username
			};
		},

		startExpiration(channel) {
			return {
				type: actionTypes.channelCaches.STARTEXPIRATION,
				channel
			};
		},

		stopExpiration(channel) {
			return {
				type: actionTypes.channelCaches.STOPEXPIRATION,
				channel
			};
		}
	},

	channelData: {
		update(channel, data) {
			return {
				type: actionTypes.channelData.UPDATE,
				channel,
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

	connectionStatus: {
		update(data) {
			return {
				type: actionTypes.connectionStatus.UPDATE,
				data
			};
		}
	},

	deviceState: {
		update(data) {
			return {
				type: actionTypes.deviceState.UPDATE,
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
		clear() {
			return {
				type: actionTypes.lineInfo.CLEAR
			};
		},

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

		update(subjectName, date, lines) {
			return {
				type: actionTypes.logFiles.UPDATE,
				subjectName,
				date,
				lines
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

	onlineFriends: {
		set(data) {
			return {
				type: actionTypes.onlineFriends.SET,
				data
			};
		}
	},

	offlineMessages: {
		add(channel, messageToken, message) {
			return {
				type: actionTypes.offlineMessages.ADD,
				channel,
				message,
				messageToken
			};
		},

		remove(channel, messageToken) {
			return {
				type: actionTypes.offlineMessages.REMOVE,
				channel,
				messageToken
			};
		}
	},

	serverData: {
		set(data) {
			return {
				type: actionTypes.serverData.SET,
				data
			};
		},

		update(server, data) {
			return {
				type: actionTypes.serverData.UPDATE,
				server,
				data
			};
		}
	},

	systemInfo: {
		update(data) {
			return {
				type: actionTypes.systemInfo.UPDATE,
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

	unseenConversations: {
		set(data) {
			return {
				type: actionTypes.unseenConversations.SET,
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

		update(username, cache) {
			return {
				type: actionTypes.userCaches.UPDATE,
				username,
				cache
			};
		},

		remove(username) {
			return {
				type: actionTypes.userCaches.REMOVE,
				username
			};
		},

		startExpiration(username) {
			return {
				type: actionTypes.userCaches.STARTEXPIRATION,
				username
			};
		},

		stopExpiration(username) {
			return {
				type: actionTypes.userCaches.STOPEXPIRATION,
				username
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
