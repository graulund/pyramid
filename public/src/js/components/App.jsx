import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

import AccessKeys from "./AccessKeys.jsx";
import ConnectionInfo from "./ConnectionInfo.jsx";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

const block = "app-container";

class App extends PureComponent {
	render() {
		const { children } = this.props;

		return (
			<div id="container" key="outer">
				<AccessKeys key="accesskeys" />
				<div className={block} key="container">
					<ConnectionInfo key="connection-info" />
					<div className={`${block}__inner`} key="inner">
						<Header key="header" />
						<div className={`${block}__iinner`} key="iinner">
							<Sidebar key="sidebar" />
							<div className={`${block}__main`} key="main">
								{ children }
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

App.propTypes = {
	children: PropTypes.node
};

export default withRouter(App);
