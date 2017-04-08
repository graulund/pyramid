import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { Router, Route, IndexRoute, browserHistory } from "react-router";

import App from "./components/App.jsx";
import ChatView from "./chatview/ChatView.jsx";
import NoChatView from "./components/NoChatView.jsx";
import SettingsView from "./settingsview/SettingsView.jsx";

import store from "./store";
import actions from "./actions";
import { initializeIo } from "./lib/io";
import * as routes from "./lib/routeHelpers";

import "../scss/site.scss";

// Temp
window.store = store;

// Data store

var currentViewState = { sidebarVisible: location.pathname === "/" };

if (window.pyramid_viewState) {
	currentViewState = { ...currentViewState, ...window.pyramid_viewState };
}

store.dispatch(actions.viewState.update(currentViewState));

if (window.pyramid_myToken) {
	store.dispatch(actions.token.set(window.pyramid_myToken));
	window.pyramid_myToken = undefined;
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

if (window.pyramid_appConfig) {
	store.dispatch(actions.appConfig.update(window.pyramid_appConfig));
}

if (window.pyramid_nicknames) {
	store.dispatch(actions.nicknames.set(window.pyramid_nicknames));
}

// Sockets

initializeIo();

// View

const main = document.querySelector("main");

if (main) {
	render(
		<Provider store={store}>
			<Router history={browserHistory}>
				<Route path={routes.homeUrl} component={App}>
					<IndexRoute component={NoChatView} />
					<Route
						path={routes.userUrl(":userName")}
						component={ChatView} />
					<Route
						path={routes.channelUrl(":serverName/:channelName")}
						component={ChatView} />
					<Route
						path={routes.userUrl(":userName", ":logDate")}
						component={ChatView} />
					<Route
						path={routes.channelUrl(":serverName/:channelName", ":logDate")}
						component={ChatView} />
					<Route
						path={routes.settingsPattern}
						component={SettingsView}
						/>
					<Route
						path={routes.categoryUrl(":categoryName")}
						component={ChatView} />
					<Route
						path="*"
						component={NoChatView} />
				</Route>
			</Router>
		</Provider>,
		main
	);
} else {
	console.warn("No container for React! :(");
}
