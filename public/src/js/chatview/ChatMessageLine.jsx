import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import Linkify from "react-linkify";
//import Highlighter from "react-highlight-words";

import ChatUsername from "./ChatUsername.jsx";
import HighlightObserver from "./HighlightObserver.jsx";
import TwitchMessageLine from "../twitch/TwitchMessageLine.jsx";
import { isTwitch } from "../lib/ircConfigs";
import { LINKIFY_PROPERTIES } from "../constants";

class ChatMessageLine extends PureComponent {

	render() {
		const {
			color, displayUsername, enableTwitch, enableTwitchColors,
			enableUsernameColors, highlight, ircConfigs, isAction, lineId, message,
			observer, server, symbol = "", tags, username
		} = this.props;

		const isHighlight = !!(highlight && highlight.length);
		const className = "msg" +
			(isAction ? " msg--action" : "") +
			(isHighlight ? " msg--highlight" : "");

		var messageEl = message;

		const useTwitch = enableTwitch && server &&
			ircConfigs && isTwitch(ircConfigs[server]);

		if (useTwitch) {
			messageEl = <TwitchMessageLine tags={tags}>{ message }</TwitchMessageLine>;
		}
		else {
			messageEl = <Linkify properties={LINKIFY_PROPERTIES}>{ messageEl }</Linkify>;
		}

		/*
		if (isHighlight) {
			// TODO: Find better non-plain text solution for this
			messageEl = <Highlighter searchWords={highlight} textToHighlight={message} />;
		}
		*/

		var authorClassName = "msg__author";
		var authorColor = null;
		var authorDisplayName = null;

		// Number color
		if (enableUsernameColors && typeof color === "number" && color >= 0) {
			authorColor = color;
		}

		// Twitch color
		if (enableTwitchColors && tags && tags.color) {
			authorColor = tags.color;
		}

		// Twitch display name
		if (tags && tags["display-name"]) {
			authorDisplayName = tags["display-name"];
		}

		const content = (
			<span className={className} key="main">
				{ displayUsername
					? [
						<ChatUsername
							className={authorClassName}
							color={authorColor}
							displayName={authorDisplayName}
							symbol={symbol}
							username={username}
							key="username" />,
						" "
					] : null }
				{ messageEl }
			</span>
		);

		if (isHighlight) {
			return (
				<HighlightObserver
					lineId={lineId}
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
	enableTwitch: PropTypes.bool,
	enableTwitchColors: PropTypes.bool,
	enableTwitchDisplayNames: PropTypes.bool,
	enableUsernameColors: PropTypes.bool,
	highlight: PropTypes.array,
	ircConfigs: PropTypes.object,
	isAction: PropTypes.bool,
	lineId: PropTypes.string,
	message: PropTypes.string,
	observer: PropTypes.object,
	server: PropTypes.string,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default connect(({
	appConfig: {
		enableTwitch,
		enableTwitchColors,
		enableUsernameColors
	},
	ircConfigs
}) => ({
	enableTwitch,
	enableTwitchColors,
	enableUsernameColors,
	ircConfigs
}))(ChatMessageLine);
