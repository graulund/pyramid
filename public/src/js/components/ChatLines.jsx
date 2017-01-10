import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import ChatLine from "./ChatLine.jsx";
import { channelUrlFromNames } from "../lib/channelNames";

class ChatLines extends PureComponent {
	render() {
		const { displayChannel, displayUsername, messages } = this.props;

		if (!messages || !messages.length) {
			return <div className="chatview__error">No data :(</div>;
		}

		const lines = messages.map(
			(msg) => msg ? <ChatLine {...msg}
				displayChannel={displayChannel}
				displayUsername={displayUsername}
				key={msg.id} /> : null
		);

		return <ul>{ lines }</ul>;
	}
}

ChatLines.propTypes = {
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	messages: PropTypes.array
}

export default ChatLines;
