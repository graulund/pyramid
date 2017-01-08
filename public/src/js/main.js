import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { Router, Route, IndexRoute, browserHistory } from "react-router"

import App from "./components/App.jsx";
import ChatView from "./components/ChatView.jsx";
import NoChatView from "./components/NoChatView.jsx";

import store from "./store";
import actions from "./actions";
import { initializeIo } from "./lib/io";
import { updateIrcConfigs } from "./lib/ircConfigs";

// Redux

store.dispatch(actions.viewState.update({}));

if (window.pyramid_friendsList) {
	for(var level in window.pyramid_friendsList) {
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
const basename = "";
const history = null;

const props = { basename, history };

render(
	<Provider store={store}>
		<Router
			basename={basename}
			history={browserHistory}
		>
			<Route path="/" component={App}>
				<IndexRoute component={NoChatView} />
				<Route path="/user/:userName" component={ChatView} />
				<Route path="/channel/:serverName/:channelName" component={ChatView} />
			</Route>
		</Router>
	</Provider>,
	main
);

/* <App {...props} /> */
