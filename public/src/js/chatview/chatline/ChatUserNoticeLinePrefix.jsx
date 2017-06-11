import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatLinePrefix from "./ChatLinePrefix.jsx";

class ChatUserNoticeLinePrefix extends PureComponent {
	render() {
		let { tags } = this.props;
		let systemMessage = tags && tags["system-msg"];

		return <ChatLinePrefix>{ systemMessage }</ChatLinePrefix>;
	}
}

ChatUserNoticeLinePrefix.propTypes = {
	tags: PropTypes.object.isRequired
};

export default ChatUserNoticeLinePrefix;
