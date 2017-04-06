import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";
import { GLOBAL_CONNECTION, STATUS } from "../lib/connectionStatus";

const block = "app-container";

class App extends PureComponent {

	renderConnectionInfo() {
		const { connectionStatus } = this.props;

		if (connectionStatus) {
			const globalConnectionStatus = connectionStatus[GLOBAL_CONNECTION];
			if (globalConnectionStatus && globalConnectionStatus.status) {
				switch (globalConnectionStatus.status) {
					case STATUS.DISCONNECTED:
						return (
							<div className="connection-warning">
								Currently disconnected from Pyramid.
								Trying to reconnect&#8230;
							</div>
						);
					case STATUS.REJECTED: {
						let encodedUrl = encodeURIComponent(location.pathname);
						let loginUrl = `/login?redirect=${encodedUrl}`;
						return (
							<div className="connection-warning">
								Oops, Pyramid could not authorize you.
								Please <a href={loginUrl}>log in</a> again.
							</div>
						);
					}
				}
			}
		}

		return null;
	}

	render() {
		const { children } = this.props;

		const connectionInfo = this.renderConnectionInfo();

		const className = block +
			(connectionInfo ? ` ${block}--with-connection-info` : "");

		return (
			<div className={className} key="container">
				{ connectionInfo }
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
