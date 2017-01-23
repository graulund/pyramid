import React, { PureComponent, PropTypes } from "react";

import ChatLine from "./ChatLine.jsx";

class ChatLines extends PureComponent {
	render() {
		const { displayChannel, displayUsername, messages } = this.props;

		if (!messages || !messages.length) {
			return null;
		}

		// TODO: Separate by date headers

		const lines = messages.map(
			(msg, index) => msg ? <ChatLine {...msg}
				displayChannel={displayChannel}
				displayUsername={displayUsername}
				key={msg.id || index} /> : null
		);

		return <ul>{ lines }</ul>;
	}
}

ChatLines.propTypes = {
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	messages: PropTypes.array
};

export default ChatLines;
