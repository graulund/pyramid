import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { Router, Route, IndexRoute, browserHistory } from "react-router";

import App from "./components/App.jsx";
import ChatView from "./components/ChatView.jsx";
import NoChatView from "./components/NoChatView.jsx";

import store from "./store";
import actions from "./actions";
import { initializeIo } from "./lib/io";
import { updateIrcConfigs } from "./lib/ircConfigs";
import { homeUrl, channelUrl, userUrl } from "./lib/routeHelpers";

// Redux

store.dispatch(actions.viewState.update({ sidebarVisible: location.pathname === "/" }));

if (window.pyramid_myToken) {
	store.dispatch(actions.token.set(window.pyramid_myToken));
	window.pyramid_myToken = undefined;
}

if (window.pyramid_friendsList) {
	for (var level in window.pyramid_friendsList) {
		store.dispatch(actions.friendsList.update(level, window.pyramid_friendsList[level]));
	}
}

if (window.pyramid_ircConfigs) {
	updateIrcConfigs(window.pyramid_ircConfigs);
}

if (window.pyramid_lastSeenChannels) {
	store.dispatch(actions.lastSeenChannels.update(window.pyramid_lastSeenChannels));
}

if (window.pyramid_lastSeenUsers) {
	store.dispatch(actions.lastSeenUsers.update(window.pyramid_lastSeenUsers));
}

initializeIo();

// React

const main = document.querySelector("main");

if (main) {
	render(
		<Provider store={store}>
			<Router history={browserHistory}>
				<Route path={homeUrl} component={App}>
					<IndexRoute component={NoChatView} />
					<Route
						path={userUrl(":userName")}
						component={ChatView} />
					<Route
						path={channelUrl(":serverName/:channelName")}
						component={ChatView} />
					<Route
						path={userUrl(":userName", ":logDate")}
						component={ChatView} />
					<Route
						path={channelUrl(":serverName/:channelName", ":logDate")}
						component={ChatView} />
				</Route>
			</Router>
		</Provider>,
		main
	);
} else {
	console.warn("No container for React! :(");
}
