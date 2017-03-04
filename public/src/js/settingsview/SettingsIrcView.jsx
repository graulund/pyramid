import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

class SettingsIrcView extends PureComponent {
	render() {
		return (
			<div key="main">
				<button>Add IRC network</button>
				<h1>IRC</h1>
			</div>
		);
	}
}

SettingsIrcView.propTypes = {
	ircConfigs: PropTypes.object
};

export default connect(({ ircConfigs }) => ({ ircConfigs }))(SettingsIrcView);
