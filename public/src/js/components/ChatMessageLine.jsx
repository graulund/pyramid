import React, { PureComponent, PropTypes } from "react";
import Linkify from "react-linkify";
import Highlighter from "react-highlight-words";

import HighlightObserver from "./HighlightObserver.jsx";
import UserLink from "./UserLink.jsx";

const linkifyProperties = { target: "_blank" };

class ChatMessageLine extends PureComponent {
	render() {
		const {
			displayUsername, highlight, id, isAction, message, observer, symbol = "", username
		} = this.props;

		const isHighlight = !!(highlight && highlight.length);
		const className = "msg" +
			(isAction ? " msg--action" : "") +
			(isHighlight ? " msg--highlight" : "");

		var messageEl = message;

		if (highlight && highlight.length) {
			messageEl = <Highlighter searchWords={highlight} textToHighlight={message} />;
		}

		const content = (
			<span className={className}>
				{ displayUsername
					? (
						<strong className="msg__author">
							{ symbol }
							<UserLink userName={username} key={username} />
							{" "}
						</strong>
					) : null }
				<span><Linkify properties={linkifyProperties}>
					{ messageEl }
				</Linkify></span>
			</span>
		);

		if (isHighlight) {
			return (
				<HighlightObserver
					id={id}
					observer={observer}
					key="highlightobserver">
					{ content }
				</HighlightObserver>
			);
		}

		return content;
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
	observer: PropTypes.object,
	server: PropTypes.string,
	symbol: PropTypes.string,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatMessageLine;
