import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatLinePrefix from "./ChatLinePrefix.jsx";

class ChatClearChatLinePrefix extends PureComponent {
	render() {
		return <ChatLinePrefix>{ this.props.message }</ChatLinePrefix>;
	}
}

ChatClearChatLinePrefix.propTypes = {
	message: PropTypes.string
};

export default ChatClearChatLinePrefix;
