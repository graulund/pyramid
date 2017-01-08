import React, { Component, PropTypes } from "react";

import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

class App extends Component {
	render() {
		const { action, basename, children, location } = this.props;

		return (
			<div className="app-container">
				<Sidebar key="sidebar" />
				{ children }
			</div>
		);

		/*
				<Header key="header" />
		return (
			<Router
				basename={basename}
				history={browserHistory}
			>
				<Route path="/" component={Header} />
				<Route path="/" component={Sidebar} />
				<Route path="/" exactly component={ChatView} />
				<Route path="/user/:userName" component={ChatView} />
				<Route path="/channel/:channelName" component={ChatView} />
			</Router>
		);
		/*

basename={basename}
history={browserHistory}
location={location}
action={action}
onChange={
	(location, action) => {
		console.log("Navigated:", location, action);
	}
}

<div className="app-container">
	<Header key="header" />
	<Sidebar key="sidebar" />
	<Route path="/" component={ChatView} />
	<Route path="/user/:userName" component={ChatView} />
	<Route path="/channel/:channelName" component={ChatView} />
</div>

<Route path="/">
	<Header key="header" />
	<Sidebar key="sidebar" />
	<Route path="/" component={ChatView} />
	<Route path="/user/:userName" component={ChatView} />
	<Route path="/channel/:channelName" component={ChatView} />
</Route>
		*/
	}
}

App.propTypes = {
	action: PropTypes.string,
	basename: PropTypes.string,
	children: PropTypes.node,
	history: PropTypes.object,
	location: PropTypes.object
};

export default App;
