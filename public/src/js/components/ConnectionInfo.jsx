import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";

import { reconnectToIrcServer } from "../lib/io";
import { GLOBAL_CONNECTION, STATUS } from "../lib/connectionStatus";

const block = "connection-warning", fullClassName = `${block}__full`,
	shortClassName = `${block}__short`;

class ConnectionInfo extends PureComponent {
	constructor(props) {
		super(props);
		this.eventHandlers = {};
	}

	createEventHandler(key) {
		return {
			reconnect: () => reconnectToIrcServer(key)
		};
	}

	getEventHandler(key) {
		// Cache the value change handlers so they don't change

		if (!this.eventHandlers[key]) {
			this.eventHandlers[key] = this.createEventHandler(key);
		}

		return this.eventHandlers[key];
	}

	renderWarning(warning) {
		return [
			(
				<div className={fullClassName} key="full">
					{ warning.content }
				</div>
			),
			(
				<div className={shortClassName} key="short">
					{ warning.shortContent }
				</div>
			)
		];
	}

	render() {
		const { connectionStatus } = this.props;

		if (connectionStatus) {
			// Global connection
			const globalConnectionStatus = connectionStatus[GLOBAL_CONNECTION];
			var globalWarning;

			if (globalConnectionStatus && globalConnectionStatus.status) {
				const status = globalConnectionStatus.status;
				switch (status) {
					case STATUS.DISCONNECTED:
						globalWarning = {
							status,
							content:
								"Currently disconnected from Pyramid. " +
								"Trying to reconnect…",
							shortContent:
								"Disconnected from Pyramid"
						};
						globalWarning.textContent = globalWarning.content;
						break;
					case STATUS.FAILED:
						// TODO: Manual retry
						globalWarning = {
							status,
							content:
								"Currently disconnected from Pyramid. Reload to reconnect.",
							shortContent:
								"Disconnected from Pyramid"
						};
						globalWarning.textContent = globalWarning.content;
						break;
					case STATUS.REJECTED: {
						let encodedUrl = encodeURIComponent(location.pathname);
						let loginUrl = `/login?redirect=${encodedUrl}`;
						globalWarning = {
							status,
							content:
								[
									"Oops, Pyramid could not authorize you. Please ",
									<a href={loginUrl} key="login">log in</a>,
									" again."
								],
							shortContent:
							[
								"Please ",
								<a href={loginUrl} key="login">log in</a>,
								" again"
							],
							textContent:
								"Oops, Pyramid could not authorize you. Please log in again."
						};
						break;
					}
				}
			}

			if (globalWarning) {
				return (
					<div className={block} key={block} data-status={globalWarning.status}>
						{ this.renderWarning(globalWarning) }
					</div>
				);
			}

			// IRC connections
			var warnings = [], warning;
			forOwn(connectionStatus, (state, key) => {
				if (state && key !== GLOBAL_CONNECTION) {
					const eventHandler = this.getEventHandler(key);
					const status = state.status;
					switch (status) {
						case STATUS.DISCONNECTED:
							warning = {
								status,
								content:
									"Pyramid is currently disconnected from the IRC " +
									`network “${key}”. Trying to reconnect…`,
								shortContent:
									`Disconnected from IRC “${key}”`
							};
							warning.textContent = warning.content;
							warnings.push(warning);
							break;
						case STATUS.REJECTED:
							warnings.push({
								status,
								content:
									"Pyramid was prevented from connecting to the IRC " +
									`network “${key}”. Please check the configuration.`,
								shortContent:
									`Prevented from joining IRC “${key}”`
							});
							warning.textContent = warning.content;
							warnings.push(warning);
							break;
						case STATUS.FAILED:
							var content = (
								<span>
									Pyramid was disconnected from the IRC network “{ key }”.
									{" "}
									<a href="javascript://"
										onClick={eventHandler.reconnect}
										key="reconnect">
										Reconnect
									</a>
								</span>
							);
							var shortContent = (
								<span>
									Disconnected from IRC “{ key }”.
									{" "}
									<a href="javascript://"
										onClick={eventHandler.reconnect}
										key="reconnect">
										Reconnect
									</a>
								</span>
							);
							var textContent =
								`Pyramid was disconnected from the IRC network “${key}”.`;
							warnings.push({ status, content, shortContent, textContent });
							break;
					}
				}
			});

			if (warnings.length) {

				// Special multiple cases
				if (warnings.length > 1) {
					const disconnected = warnings.filter((w) => w.status === STATUS.DISCONNECTED);
					const rejected = warnings.filter((w) => w.status === STATUS.REJECTED);
					var groupWarning;

					if (disconnected.length > 1) {
						// Group disconnected
						const nonDisconnected = warnings.filter((w) => w.status !== STATUS.DISCONNECTED);
						groupWarning = {
							status: STATUS.DISCONNECTED,
							content:
								`Pyramid was disconnected from ${warnings.length} ` +
								"IRC networks. Trying to reconnect…",
							shortContent:
								`Disconnected from ${warnings.length} IRCs`
						};
						groupWarning.textContent = groupWarning.content;
						warnings = [groupWarning].concat(nonDisconnected);
					}

					if (rejected.length > 1) {
						// Group rejected
						const nonRejected = warnings.filter((w) => w.status !== STATUS.REJECTED);
						groupWarning = {
							status: STATUS.REJECTED,
							content:
								`Pyramid was prevented from connecting to ${warnings.length} ` +
								"IRC networks. Please check the configuration.",
							shortContent:
								`Prevented from joining ${warnings.length} IRCs`
						};
						groupWarning.textContent = groupWarning.content;
						warnings = [groupWarning].concat(nonRejected);
					}
				}

				const title = warnings.map(({ textContent }) => textContent || "").join(" ");

				return (
					<ul className={block} key={block} title={title}>
						{ warnings.map(
							(warning, i) => (
								<li key={i} data-status={warning.status}>
									{ this.renderWarning(warning) }
								</li>
							)
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
