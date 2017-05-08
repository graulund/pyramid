import { combineReducers } from "redux";

import appConfig from "./appConfig";
import categoryCaches from "./categoryCaches";
import channelCaches from "./channelCaches";
import channelUserLists from "./channelUserLists";
import connectionStatus from "./connectionStatus";
import deviceState from "./deviceState";
import friendsList from "./friendsList";
import ircConfigs from "./ircConfigs";
import lastSeenChannels from "./lastSeenChannels";
import lastSeenUsers from "./lastSeenUsers";
import lineInfo from "./lineInfo";
import logDetails from "./logDetails";
import logFiles from "./logFiles";
import multiServerChannels from "./multiServerChannels";
import nicknames from "./nicknames";
import onlineFriends from "./onlineFriends";
import systemInfo from "./systemInfo";
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
	deviceState,
	friendsList,
	ircConfigs,
	lastSeenChannels,
	lastSeenUsers,
	lineInfo,
	logDetails,
	logFiles,
	multiServerChannels,
	nicknames,
	onlineFriends,
	systemInfo,
	token,
	unseenHighlights,
	userCaches,
	viewState
});
