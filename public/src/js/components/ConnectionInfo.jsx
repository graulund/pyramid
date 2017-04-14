import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";

import { reconnectToIrcServer } from "../lib/io";
import { GLOBAL_CONNECTION, STATUS } from "../lib/connectionStatus";

class ConnectionInfo extends PureComponent {
	render() {
		const { connectionStatus } = this.props;

		if (connectionStatus) {
			// Global connection
			const globalConnectionStatus = connectionStatus[GLOBAL_CONNECTION];
			if (globalConnectionStatus && globalConnectionStatus.status) {
				switch (globalConnectionStatus.status) {
					case STATUS.DISCONNECTED:
						return (
							<div className="connection-warning" key="connection-warning">
								Currently disconnected from Pyramid.
								Trying to reconnect&#8230;
							</div>
						);
					case STATUS.FAILED:
						// TODO: Manual retry
						return (
							<div className="connection-warning" key="connection-warning">
								Currently disconnected from Pyramid.
							</div>
						);
					case STATUS.REJECTED: {
						let encodedUrl = encodeURIComponent(location.pathname);
						let loginUrl = `/login?redirect=${encodedUrl}`;
						return (
							<div className="connection-warning" key="connection-warning">
								Oops, Pyramid could not authorize you.
								Please <a href={loginUrl}>log in</a> again.
							</div>
						);
					}
				}
			}

			// IRC connections
			const connectionWarnings = [];
			forOwn(connectionStatus, (state, key) => {
				if (key !== GLOBAL_CONNECTION) {
					switch (state.status) {
						case STATUS.DISCONNECTED:
							connectionWarnings.push(
								`Pyramid is currently disconnected from the IRC network “${key}”. Trying to reconnect…`
							);
							break;
						case STATUS.REJECTED:
							connectionWarnings.push(
								`Pyramid was prevented from connecting to the IRC network “${key}”. Please check the configuration.`
							);
							break;
						case STATUS.FAILED:
							connectionWarnings.push((
								<span>
									Pyramid was disconnected from the IRC network “{ key }”.
									{" "}
									<a href="javascript://"
										onClick={() => reconnectToIrcServer(key)}>
										Reconnect
									</a>
								</span>
							));
							break;
					}
				}
			});
			if (connectionWarnings.length) {
				return (
					<ul className="connection-warning" key="connection-warning">
						{ connectionWarnings.map(
							(content, i) => <li key={i}>{ content }</li>
						)}
					</ul>
				);
			}
		}

		return null;
	}
}

ConnectionInfo.propTypes = {
	connectionStatus: PropTypes.object
};

export default connect(
	({ connectionStatus }) => ({ connectionStatus })
)(ConnectionInfo);
