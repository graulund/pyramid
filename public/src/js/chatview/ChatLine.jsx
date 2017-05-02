import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChannelLink from "../components/ChannelLink.jsx";
import ChatBunchedEventsLine from "./ChatBunchedEventsLine.jsx";
import ChatContextView from "./ChatContextView.jsx";
import ChatHighlightedLine from "./ChatHighlightedLine.jsx";
import ChatMessageLine from "./ChatMessageLine.jsx";
import ChatUserEventLine from "./ChatUserEventLine.jsx";
import LogLine from "./LogLine.jsx";
import { dateStamp, timeStamp } from "../lib/formatting";

const block = "line";

class ChatLine extends PureComponent {
	render() {
		const {
			displayContextLink = false,
			...contextProps
		} = this.props;

		const {
			channel,
			displayChannel,
			highlight,
			lineId,
			time,
			type
		} = this.props;

		if (displayContextLink) {
			// Display a context view instead
			return <ChatContextView {...contextProps} key="content" />;
		}

		const d = new Date(time);
		const timestamp = timeStamp(d);
		const datestamp = dateStamp(d);

		const isHighlight = !!(highlight && highlight.length);
		const className = block +
			(isHighlight ? ` ${block}--highlight` : "") +
			(type === "notice" ? ` ${block}--notice` : "");

		var content = null;

		switch (type) {
			case "msg":
			case "action":
			case "notice":
				content = <ChatMessageLine {...this.props} key="content" />;
				break;
			case "join":
			case "part":
			case "quit":
			case "kick":
			case "kill":
			case "+mode":
			case "-mode":
				content = <ChatUserEventLine {...this.props} key="content" />;
				break;
			case "events":
				content = <ChatBunchedEventsLine {...this.props} key="content" />;
				break;
			case "log":
				content = <LogLine {...this.props} key="content" />;
				break;
		}

		if (!content) {
			content = <em key="placeholder">{ `no template for \`${type}\` event` }</em>;
		}

		var channelEl = null;

		if (displayChannel && channel) {
			channelEl = (
				<span className={`${block}__channel`} key="channel">
					<ChannelLink channel={channel} key={channel} />
					{" "}
				</span>
			);
		}

		const timeStampEl = (
			<time
				dateTime={time}
				title={datestamp + " " + timestamp}
				key="timestamp">
				{ timestamp }
			</time>
		);

		const outerContent = [
			channelEl,
			timeStampEl,
			" ",
			content
		];

		const itemProps = {
			className,
			id: `line-${lineId}`
		};

		if (isHighlight) {
			return (
				<ChatHighlightedLine {...itemProps} {...this.props}>
					{ outerContent }
				</ChatHighlightedLine>
			);
		}

		return <li {...itemProps}>{ outerContent }</li>;
	}
}

ChatLine.propTypes = {
	argument: PropTypes.string,
	by: PropTypes.string,
	channel: PropTypes.string,
	channelName: PropTypes.string,
	color: PropTypes.number,
	contextMessages: PropTypes.array,
	displayChannel: PropTypes.bool,
	displayContextLink: PropTypes.bool,
	displayUsername: PropTypes.bool,
	events: PropTypes.array,
	highlight: PropTypes.array,
	lineId: PropTypes.string,
	message: PropTypes.string,
	mode: PropTypes.string,
	observer: PropTypes.object,
	onEmoteLoad: PropTypes.func,
	reason: PropTypes.string,
	server: PropTypes.string,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatLine;
