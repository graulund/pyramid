import React, { PureComponent } from "react";
import PropTypes from "prop-types";

class ChatUserNoticeLinePrefix extends PureComponent {
	render() {
		let { tags } = this.props;

		let systemMessage = tags && tags["system-msg"];

		if (systemMessage) {
			return <div className="prefix">{ systemMessage }</div>;
		}

		return null;
	}
}

ChatUserNoticeLinePrefix.propTypes = {
	tags: PropTypes.object
};

export default ChatUserNoticeLinePrefix;
