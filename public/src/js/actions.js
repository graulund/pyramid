import * as actionTypes from "./actionTypes";

export default {
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
	viewState: {
		update(data) {
			return {
				type: actionTypes.viewState.UPDATE,
				data
			};
		}
	}
};
