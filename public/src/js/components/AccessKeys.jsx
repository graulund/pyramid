import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { setAppConfigValue } from "../lib/io";
import { setDarkModeStatus } from "../lib/visualBehavior";

class AccessKeys extends PureComponent {
	constructor(props) {
		super(props);

		this.toggleDarkMode = this.toggleDarkMode.bind(this);
	}

	toggleDarkMode() {
		let { enableDarkMode = false } = this.props;

		setDarkModeStatus(!enableDarkMode);
		setAppConfigValue("enableDarkMode", !enableDarkMode);
	}

	render() {
		return (
			<div className="accesskeys">
				<a
					href="javascript://"
					accessKey="k"
					onClick={this.toggleDarkMode}
					key="darkmode">Dark mode</a>
			</div>
		);
	}
}

AccessKeys.propTypes = {
	enableDarkMode: PropTypes.bool
};

export default connect(({
	appConfig: { enableDarkMode }
}) => ({
	enableDarkMode
}))(AccessKeys);
