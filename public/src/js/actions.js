import * as actionTypes from "./actionTypes";

export default {
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
	friendsList: {
		update(level, data) {
			return {
				type: actionTypes.friendsList.UPDATE,
				level,
				data
			};
		}
	},
	ircConfigs: {
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
	multiServerChannels: {
		set(data) {
			return {
				type: actionTypes.multiServerChannels.SET,
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
