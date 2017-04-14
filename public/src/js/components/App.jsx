import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ConnectionInfo from "./ConnectionInfo.jsx";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";
import { STATUS } from "../lib/connectionStatus";

const block = "app-container";

class App extends PureComponent {

	hasConnectionInfo() {
		const { connectionStatus } = this.props;

		return Object.keys(connectionStatus).filter((key) => {
			return connectionStatus[key] &&
				connectionStatus[key].status !== STATUS.CONNECTED;
		}).length;
	}

	render() {
		const { children } = this.props;

		const hasNotice = this.hasConnectionInfo();

		const className = block +
			(hasNotice ? ` ${block}--with-notice` : "");

		return (
			<div className={className} key="container">
				<ConnectionInfo key="connection-info" />
				<Header key="header" />
				<Sidebar key="sidebar" />
				{ children }
			</div>
		);
	}
}

App.propTypes = {
	children: PropTypes.node,
	connectionStatus: PropTypes.object
};

export default connect(
	({ connectionStatus }) => ({ connectionStatus })
)(App);
