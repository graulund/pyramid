import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import { STATUS } from "../../lib/connectionStatus";

const block = "connectionevent";

class ChatConnectionEventLine extends PureComponent {
	render() {
		const { server, status } = this.props;

		var by = "by";

		switch (status) {
			case STATUS.CONNECTED:
				by = "to";
				break;
			case STATUS.DISCONNECTED:
				by = "from";
				break;
			case STATUS.FAILED:
				by = "to connect to";
				break;
			case STATUS.ABORTED:
				by = "connecting to";
				break;
		}

		const className = block +
			(status !== STATUS.CONNECTED ? ` ${block}--bad` : "");

		return (
			<span className={className}>
				<strong className={`${block}__status`}>
					{ status }
				</strong>
				{ " " + by + " " + server }
			</span>
		);
	}
}

ChatConnectionEventLine.propTypes = {
	channel: PropTypes.string,
	channelName: PropTypes.string,
	lineId: PropTypes.string,
	server: PropTypes.string.isRequired,
	status: PropTypes.string.isRequired,
	time: PropTypes.string,
	type: PropTypes.string
};

export default ChatConnectionEventLine;
