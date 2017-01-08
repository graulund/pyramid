import { combineReducers } from "redux";

import friendsList from "./friendsList";
import ircConfigs from "./ircConfigs";
import lastSeenChannels from "./lastSeenChannels";
import lastSeenUsers from "./lastSeenUsers";
import multiServerChannels from "./multiServerChannels";
import viewState from "./viewState";

export default combineReducers({
	friendsList,
	ircConfigs,
	lastSeenChannels,
	lastSeenUsers,
	multiServerChannels,
	viewState
});
