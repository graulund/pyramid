import React, { PureComponent, PropTypes } from "react";
import Linkify from "react-linkify";
import Highlighter from "react-highlight-words";

import UserLink from "./UserLink.jsx";

const linkifyProperties = { target: "_blank" };

class ChatMessageLine extends PureComponent {
	render() {
		const {
			displayUsername, highlight, isAction, message, username
		} = this.props;

		const isHighlight = !!(highlight && highlight.length);
		const className = "msg" +
			(isAction ? " msg--action" : "") +
			(isHighlight ? " msg--highlight" : "");

		var messageEl = message;

		if (highlight && highlight.length) {
			messageEl = <Highlighter searchWords={highlight} textToHighlight={message} />;
		}

		return (
			<span className={className}>
				{ displayUsername
					? (
						<strong className="msg__author">
							<UserLink userName={username} key={username} />
							{" "}
						</strong>
					) : null }
				<span><Linkify properties={linkifyProperties}>
					{ messageEl }
				</Linkify></span>
			</span>
		);
	}
}

ChatMessageLine.propTypes = {
	channel: PropTypes.string,
	channelName: PropTypes.string,
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	highlight: PropTypes.array,
	id: PropTypes.string,
	isAction: PropTypes.bool,
	message: PropTypes.string,
	server: PropTypes.string,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatMessageLine;
