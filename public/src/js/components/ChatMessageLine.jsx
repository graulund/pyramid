import React, { PureComponent, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import Linkify from "react-linkify";
import Highlighter from "react-highlight-words";
import "intersection-observer";

import UserLink from "./UserLink.jsx";

const linkifyProperties = { target: "_blank" };


class ChatMessageLine extends PureComponent {
	componentDidMount () {
		const { highlight, observer } = this.props;

		if (highlight && highlight.length && observer) {
			const root = findDOMNode(this);
			if (root) {
				this.root = root;
				observer.observe(root);
				this.observed = true;
			}
		}
	}

	componentWillUnmount() {
		if (this.observed && this.root && this.props.observer) {
			this.props.observer.unobserve(this.root);
		}
	}

	render() {
		const {
			displayUsername, highlight, isAction, message, symbol = "", username
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
