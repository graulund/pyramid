import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { GLOBAL_CONNECTION, STATUS } from "../../lib/connectionStatus";
import { resendOfflineMessage } from "../../lib/posting";

// How many ms before the button becomes visible
const VISIBILITY_TIME_MS = 5000;

const block = "line__offline-resend";

class ChatOfflineResendButton extends PureComponent {
	constructor(props) {
		super(props);

		this.resend = this.resend.bind(this);
		this.show = this.show.bind(this);

		let visible = this.prepareVisibility(props);

		this.state = { clicked: false, visible };
	}

	componentWillReceiveProps(newProps) {
		if (newProps.time !== this.props.time) {
			let visible = this.prepareVisibility(newProps);
			if (visible !== this.state.visible) {
				this.setState({ clicked: false, visible });
			}
		}
	}

	componentWillUnmount() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}

	prepareVisibility(props = this.props) {
		let visibleTime = new Date(props.time).valueOf() + VISIBILITY_TIME_MS;
		let timeUntilVisible = visibleTime - new Date();
		let visible = timeUntilVisible < 200;

		if (!visible) {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = null;
			}

			this.timeoutId = setTimeout(this.show, timeUntilVisible);
		}

		return visible;
	}

	resend() {
		let { channel, messageToken } = this.props;
		resendOfflineMessage(channel, messageToken);
		this.setState({ clicked: true });
	}

	show() {
		this.setState({ clicked: false, visible: true });
	}

	render() {
		let { globalConnectionStatus } = this.props;
		let { clicked, visible } = this.state;

		if (
			!clicked &&
			visible &&
			globalConnectionStatus &&
			globalConnectionStatus.status === STATUS.CONNECTED
		) {
			return (
				<a
					className={block}
					onClick={this.resend}
					href="javascript://"
					title="Tries to send this message to Pyramid again">
					Resend
				</a>
			);
		}

		return null;
	}
}

ChatOfflineResendButton.propTypes = {
	channel: PropTypes.string.isRequired,
	globalConnectionStatus: PropTypes.object,
	messageToken: PropTypes.string.isRequired,
	time: PropTypes.string.isRequired
};

export default connect(({
	connectionStatus
}) => ({
	globalConnectionStatus: connectionStatus[GLOBAL_CONNECTION]
}))(ChatOfflineResendButton);
