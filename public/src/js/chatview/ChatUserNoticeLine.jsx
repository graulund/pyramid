import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatMessageLine from "./ChatMessageLine.jsx";

class ChatUserNoticeLine extends PureComponent {
	render() {
		let { tags } = this.props;

		let systemMessage = tags && tags["system-msg"];

		return (
			<span className="usernotice">
				{ systemMessage ? <em>{ systemMessage }</em> : null }
				<ChatMessageLine {...this.props} key="content" />
			</span>
		);
	}
}

ChatUserNoticeLine.propTypes = {
	tags: PropTypes.object
};

export default ChatUserNoticeLine;
