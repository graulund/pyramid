import React, { PureComponent, PropTypes } from "react";
import Linkify from "react-linkify";
//import Highlighter from "react-highlight-words";

import HighlightObserver from "./HighlightObserver.jsx";
import TwitchMessageLine from "../twitch/TwitchMessageLine.jsx";
import UserLink from "../components/UserLink.jsx";
import { LINKIFY_PROPERTIES } from "../constants";

class ChatMessageLine extends PureComponent {

	render() {
		const {
			color, displayUsername, highlight, id, isAction,
			message, observer, symbol = "", tags, username
		} = this.props;

		const isHighlight = !!(highlight && highlight.length);
		const className = "msg" +
			(isAction ? " msg--action" : "") +
			(isHighlight ? " msg--highlight" : "");

		var messageEl = message;

		const isTwitch = true; // TEMP

		if (isTwitch) {
			messageEl = <TwitchMessageLine tags={tags}>{ message }</TwitchMessageLine>;
		}
		else {
			messageEl = <Linkify properties={LINKIFY_PROPERTIES}>{ messageEl }</Linkify>;
		}

		/* if (highlight && highlight.length) {
			// TODO: Find better non-plain text solution for this
			messageEl = <Highlighter searchWords={highlight} textToHighlight={message} />;
		} */

		var authorClassName = "msg__author";

		if (typeof color === "number" && color >= 0) {
			authorClassName += " msg__author--color-" + color;
		}

		const content = (
			<span className={className}>
				{ displayUsername
					? (
						<strong className={authorClassName}>
							{ symbol }
							<UserLink userName={username} key={username} />
							{" "}
						</strong>
					) : null }
				{ messageEl }
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
	color: PropTypes.number,
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	highlight: PropTypes.array,
	id: PropTypes.string,
	isAction: PropTypes.bool,
	message: PropTypes.string,
	observer: PropTypes.object,
	server: PropTypes.string,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatMessageLine;
