import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChannelLink from "../components/ChannelLink.jsx";
import ChatBunchedEventsLine from "./chatline/ChatBunchedEventsLine.jsx";
import ChatConnectionEventLine from "./chatline/ChatConnectionEventLine.jsx";
import ChatContextView from "./ChatContextView.jsx";
import ChatHighlightedLine from "./chatline/ChatHighlightedLine.jsx";
import ChatMessageLine from "./chatline/ChatMessageLine.jsx";
import ChatOfflineResendButton from "./chatline/ChatOfflineResendButton.jsx";
import ChatUserEventLine from "./chatline/ChatUserEventLine.jsx";
import ChatUserNoticeLinePrefix from "./chatline/ChatUserNoticeLinePrefix.jsx";
import LogLine from "./chatline/LogLine.jsx";
import { getChannelDisplayNameFromState } from "../lib/channelNames";
import { prepareBunchedEvents } from "../lib/chatEvents";
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
			channelDisplayName,
			displayChannel,
			highlight,
			lineId,
			message,
			offline,
			showTwitchClearChats,
			showUserEvents,
			status,
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
		const isNotice = type === "notice" || type === "usernotice";
		const className = block +
			(isHighlight ? ` ${block}--highlight` : "") +
			(isNotice ? ` ${block}--notice` : "") +
			(type === "connectionEvent" ? ` ${block}--connection` : "") +
			(offline ? ` ${block}--offline` : "");

		var content = null, prefix = null;

		switch (type) {

			case "msg":
			case "action":
			case "notice":
			case "usernotice":
				if (message) {
					content = <ChatMessageLine
						{...this.props}
						key="content" />;
				}
				if (type === "usernotice") {
					prefix = <ChatUserNoticeLinePrefix
						{...this.props}
						key="prefix" />;
				}
				break;

			case "join":
			case "part":
			case "quit":
			case "kick":
			case "kill":
			case "mode":
				if (showUserEvents) {
					content = <ChatUserEventLine
						{...this.props}
						key="content" />;
				}
				break;

			case "events":
				if (showUserEvents) {
					var { collapseJoinParts, ...bunchedProps } = this.props;
					var calculated = prepareBunchedEvents(bunchedProps, collapseJoinParts);
					if (
						calculated &&
						(calculated.joins.length || calculated.parts.length)
					) {
						content = <ChatBunchedEventsLine
							{...this.props}
							{...calculated}
							key="content" />;
					}
				}
				break;

			case "log":
				content = <LogLine
					{...this.props}
					key="content" />;
				break;

			case "connectionEvent":
				if (status) {
					content = <ChatConnectionEventLine
						{...this.props}
						key="content" />;
				}
				break;

			case "clearchat":
				if (showTwitchClearChats) {
					content = <ChatUserEventLine
						{...this.props}
						key="content" />;
				}
				break;

			default:
				content = (
					<em key="placeholder">
						no template for `{ type }` event
					</em>
				);
				break;
		}

		if (!content && !prefix) {
			return null;
		}

		var channelEl = null;

		if (displayChannel && channel) {
			channelEl = (
				<span className={`${block}__channel`} key="channel">
					<ChannelLink
						channel={channel}
						displayName={channelDisplayName}
						key={channel} />
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

		var outerContent;

		if (content) {
			let innerContent = [content];
			let mainContent = (
				<div className={`${block}__main`} key="main">
					{ channelEl }
					{ timeStampEl }
					<span key="inner">{ innerContent }</span>
				</div>
			);

			outerContent = [prefix, mainContent];

			if (offline) {
				let { messageToken } = this.props;
				innerContent.push(" ");
				innerContent.push(
					<ChatOfflineResendButton
						channel={channel}
						messageToken={messageToken}
						time={time}
						key="offline-resend" />
				);
			}
		}
		else {
			outerContent = prefix;
		}

		const itemProps = {
			className,
			id: lineId && `line-${lineId}`
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
	channelDisplayName: PropTypes.string,
	channelName: PropTypes.string,
	collapseJoinParts: PropTypes.bool,
	color: PropTypes.number,
	contextMessages: PropTypes.array,
	displayChannel: PropTypes.bool,
	displayContextLink: PropTypes.bool,
	displayUsername: PropTypes.bool,
	events: PropTypes.array,
	highlight: PropTypes.array,
	lineId: PropTypes.string,
	message: PropTypes.string,
	messageToken: PropTypes.string,
	mode: PropTypes.string,
	observer: PropTypes.object,
	offline: PropTypes.bool,
	onEmoteLoad: PropTypes.func,
	reason: PropTypes.string,
	server: PropTypes.string,
	status: PropTypes.string,
	showTwitchClearChats: PropTypes.bool,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

const mapStateToProps = function(state, ownProps) {
	let { channel } = ownProps;
	let channelDisplayName = getChannelDisplayNameFromState(state, channel);

	let {
		showTwitchClearChats,
		showUserEvents
	} = state.appConfig;

	return {
		channelDisplayName,
		showTwitchClearChats,
		showUserEvents
	};
};

export default connect(mapStateToProps)(ChatLine);
