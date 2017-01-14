import React, { Component, PropTypes } from "react";

import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

class App extends Component {
	render() {
		//const { action, basename, children, location } = this.props;
		const { children } = this.props;

		return (
			<div className="app-container">
				<Header key="header" />
				<Sidebar key="sidebar" />
				{ children }
			</div>
		);
	}
}

App.propTypes = {
	/* action: PropTypes.string,
	basename: PropTypes.string,
	children: PropTypes.node,
	history: PropTypes.object,
	location: PropTypes.object */
	children: PropTypes.node
};

export default App;
