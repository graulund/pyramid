import { combineReducers } from "redux";

import appConfig from "./appConfig";
import categoryCaches from "./categoryCaches";
import channelCaches from "./channelCaches";
import channelUserLists from "./channelUserLists";
import connectionStatus from "./connectionStatus";
import friendsList from "./friendsList";
import ircConfigs from "./ircConfigs";
import lastSeenChannels from "./lastSeenChannels";
import lastSeenUsers from "./lastSeenUsers";
import lineInfo from "./lineInfo";
import logDetails from "./logDetails";
import logFiles from "./logFiles";
import multiServerChannels from "./multiServerChannels";
import nicknames from "./nicknames";
import token from "./token";
import unseenHighlights from "./unseenHighlights";
import userCaches from "./userCaches";
import viewState from "./viewState";

export default combineReducers({
	appConfig,
	categoryCaches,
	channelCaches,
	channelUserLists,
	connectionStatus,
	friendsList,
	ircConfigs,
	lastSeenChannels,
	lastSeenUsers,
	lineInfo,
	logDetails,
	logFiles,
	multiServerChannels,
	nicknames,
	token,
	unseenHighlights,
	userCaches,
	viewState
});
