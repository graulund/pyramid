import { combineReducers } from "redux";

import appConfig from "./appConfig";
import categoryCaches from "./categoryCaches";
import channelCaches from "./channelCaches";
import channelData from "./channelData";
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
import offlineMessages from "./offlineMessages";
import serverData from "./serverData";
import systemInfo from "./systemInfo";
import token from "./token";
import unseenConversations from "./unseenConversations";
import unseenHighlights from "./unseenHighlights";
import userCaches from "./userCaches";
import viewState from "./viewState";

export default combineReducers({
	appConfig,
	categoryCaches,
	channelCaches,
	channelData,
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
	offlineMessages,
	serverData,
	systemInfo,
	token,
	unseenConversations,
	unseenHighlights,
	userCaches,
	viewState
});
