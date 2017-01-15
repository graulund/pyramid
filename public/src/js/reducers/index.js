import { combineReducers } from "redux";

import channelCaches from "./channelCaches";
import friendsList from "./friendsList";
import ircConfigs from "./ircConfigs";
import lastSeenChannels from "./lastSeenChannels";
import lastSeenUsers from "./lastSeenUsers";
import logDetails from "./logDetails";
import logFiles from "./logFiles";
import multiServerChannels from "./multiServerChannels";
import token from "./token";
import userCaches from "./userCaches";
import viewState from "./viewState";

export default combineReducers({
	channelCaches,
	friendsList,
	ircConfigs,
	lastSeenChannels,
	lastSeenUsers,
	logDetails,
	logFiles,
	multiServerChannels,
	token,
	userCaches,
	viewState
});
