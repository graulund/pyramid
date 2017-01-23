import { combineReducers } from "redux";

import categoryCaches from "./categoryCaches";
import channelCaches from "./channelCaches";
import channelUserLists from "./channelUserLists";
import friendsList from "./friendsList";
import ircConfigs from "./ircConfigs";
import lastSeenChannels from "./lastSeenChannels";
import lastSeenUsers from "./lastSeenUsers";
import logDetails from "./logDetails";
import logFiles from "./logFiles";
import multiServerChannels from "./multiServerChannels";
import token from "./token";
import unseenHighlights from "./unseenHighlights";
import userCaches from "./userCaches";
import viewState from "./viewState";

export default combineReducers({
	categoryCaches,
	channelCaches,
	channelUserLists,
	friendsList,
	ircConfigs,
	lastSeenChannels,
	lastSeenUsers,
	logDetails,
	logFiles,
	multiServerChannels,
	token,
	unseenHighlights,
	userCaches,
	viewState
});
