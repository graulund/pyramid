import { combineReducers } from "redux";

import channelCaches from "./channelCaches";
import friendsList from "./friendsList";
import ircConfigs from "./ircConfigs";
import lastSeenChannels from "./lastSeenChannels";
import lastSeenUsers from "./lastSeenUsers";
import multiServerChannels from "./multiServerChannels";
import userCaches from "./userCaches";
import viewState from "./viewState";

export default combineReducers({
	channelCaches,
	friendsList,
	ircConfigs,
	lastSeenChannels,
	lastSeenUsers,
	multiServerChannels,
	userCaches,
	viewState
});
