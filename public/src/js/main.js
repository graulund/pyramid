/*eslint no-undef: 0*/
import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { Router, Route, Switch } from "react-router-dom";
import { createBrowserHistory } from "history";

import App from "./components/App.jsx";
import ChatViewWrapper from "./chatview/ChatViewWrapper.jsx";
import MultiChatView from "./chatview/MultiChatView.jsx";
import NoChatView from "./chatview/NoChatView.jsx";
import SettingsView from "./settingsview/SettingsView.jsx";

import actions from "./actions";
import { initializeIo } from "./lib/io";
import setUpDataExpiration from "./lib/dataExpiration";
import { startUpdatingElectronState } from "./lib/electron";
import { initializeMessageCaches } from "./lib/messageCaches";
import { importLayoutFromLocalStorage } from "./lib/multiChat";
import setUpPageTitles from "./lib/pageTitles";
import { startUpdatingNotificationsActiveState } from "./lib/notifications";
import * as routes from "./lib/routeHelpers";
import store from "./store";
import { initVisualBehavior, isMobile } from "./lib/visualBehavior";

import "../scss/site.scss";

if (__DEV__) {
	window.Perf = require("react-addons-perf");
	/** /
	const { whyDidYouUpdate } = require("why-did-you-update");
	whyDidYouUpdate(React);
	/**/
}

const history = createBrowserHistory();
setUpPageTitles(history);
setUpDataExpiration(history);
startUpdatingElectronState();

const isHome = location.pathname === routes.homeUrl;

// Data store

var currentViewState = {
	sidebarVisible: isHome || !isMobile()
};

if (window.pyramid_viewState) {
	currentViewState = { ...currentViewState, ...window.pyramid_viewState };
}

store.dispatch(actions.viewState.update(currentViewState));

if (window.pyramid_myToken) {
	store.dispatch(actions.token.set(window.pyramid_myToken));
	window.pyramid_myToken = undefined;
}

if (window.pyramid_appConfig) {
	store.dispatch(actions.appConfig.update(window.pyramid_appConfig));
}

if (window.pyramid_awakeTime) {
	let awakeTime = window.pyramid_awakeTime;
	store.dispatch(actions.systemInfo.update({ awakeTime }));
}

if (window.pyramid_friendsList) {
	store.dispatch(actions.friendsList.set(window.pyramid_friendsList));
}

if (window.pyramid_ircConfigs) {
	store.dispatch(actions.ircConfigs.set(window.pyramid_ircConfigs));
}

if (window.pyramid_ircConnectionState) {
	store.dispatch(actions.connectionStatus.update(window.pyramid_ircConnectionState));
}

if (window.pyramid_lastSeenChannels) {
	store.dispatch(actions.lastSeenChannels.update(window.pyramid_lastSeenChannels));
}

if (window.pyramid_lastSeenUsers) {
	store.dispatch(actions.lastSeenUsers.update(window.pyramid_lastSeenUsers));
}

if (window.pyramid_nicknames) {
	store.dispatch(actions.nicknames.set(window.pyramid_nicknames));
}

if (window.pyramid_onlineFriends) {
	store.dispatch(actions.onlineFriends.set(window.pyramid_onlineFriends));
}

if (window.pyramid_serverData) {
	store.dispatch(actions.serverData.set(window.pyramid_serverData));
}

if (window.pyramid_unseenConversations) {
	store.dispatch(actions.unseenConversations.set(window.pyramid_unseenConversations));
}

if (window.pyramid_unseenHighlights) {
	store.dispatch(actions.unseenHighlights.set(window.pyramid_unseenHighlights));
}

// Local storage

if (isHome) {
	importLayoutFromLocalStorage();
}

// Sockets

initializeIo();

// Caches

initializeMessageCaches();

// View

initVisualBehavior();
startUpdatingNotificationsActiveState();

const main = document.querySelector("main");

if (main) {
	render(
		<Provider store={store}>
			<Router history={history}>
				<App>
					<Switch>
						<Route exact path={routes.homeUrl} component={MultiChatView} />
						<Route
							path={routes.channelUrl(
								":serverName/:channelName", ":logDate", 0, false
							) + "/page/:pageNumber"}
							component={ChatViewWrapper} />
						<Route
							path={routes.channelUrl(
								":serverName/:channelName", ":logDate", 0, false
							)}
							component={ChatViewWrapper} />
						<Route
							path={routes.channelUrl(
								":serverName/:channelName", "", 0, false
							)}
							component={ChatViewWrapper} />
						<Route
							path={routes.userUrl(
								":username", ":logDate", 0, false
							) + "/page/:pageNumber"}
							component={ChatViewWrapper} />
						<Route
							path={routes.userUrl(
								":username", ":logDate", 0, false
							)}
							component={ChatViewWrapper} />
						<Route
							path={routes.userUrl(
								":username", "", 0, false
							)}
							component={ChatViewWrapper} />
						<Route
							path={routes.conversationUrl(
								":serverName", ":username", ":logDate", 0, false
							) + "/page/:pageNumber"}
							component={ChatViewWrapper} />
						<Route
							path={routes.conversationUrl(
								":serverName", ":username", ":logDate", 0, false
							)}
							component={ChatViewWrapper} />
						<Route
							path={routes.conversationUrl(
								":serverName", ":username", "", 0, false
							)}
							component={ChatViewWrapper} />
						<Route
							path={routes.settingsPattern}
							component={SettingsView} />
						<Route
							path={routes.categoryUrl(":categoryName")}
							component={ChatViewWrapper} />
						<Route
							path="*"
							component={NoChatView} />
					</Switch>
				</App>
			</Router>
		</Provider>,
		main
	);
} else {
	console.warn("No container for React! :(");
}
