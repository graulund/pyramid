import React, { PureComponent, PropTypes } from "react";
import { Link } from "react-router";
import moment from "moment";

import ChannelLink from "../components/ChannelLink.jsx";
import ChatBunchedEventsLine from "./ChatBunchedEventsLine.jsx";
import ChatMessageLine from "./ChatMessageLine.jsx";
import ChatUserEventLine from "./ChatUserEventLine.jsx";
import { channelUrl } from "../lib/routeHelpers";

class ChatLine extends PureComponent {
	render() {
		const {
			channel,
			displayChannel,
			displayContextLink = false,
			highlight,
			lineId,
			time,
			type
		} = this.props;

		const m = moment(time);
		const timestamp = m.format("H:mm:ss");
		const datestamp = m.format("YYYY-MM-DD");

		const isHighlight = !!(highlight && highlight.length);
		const className = "line" +
			(isHighlight ? " line--highlight" : "");

		var content = null;

		switch (type) {
			case "msg":
			case "action":
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
		}

		if (!content) {
			content = <em>{ `no template for \`${type}\` event` }</em>;
		}

		var channelEl = null, contextLinkEl = null;

		if (displayChannel) {
			channelEl = (
				<span className="line__channel">
					<ChannelLink channel={channel} key={channel} />
					{" "}
				</span>
			);
		}

		if (displayContextLink) {
			contextLinkEl = (
				<Link
					className="line__context"
					to={`${channelUrl(channel)}#line-${lineId}`}>
					Context
				</Link>
			);
		}

		return (
			<li id={`line-${lineId}`} className={className}>
				{ contextLinkEl }
				{ channelEl }
				<time dateTime={time} title={datestamp + " " + timestamp}>
					{ timestamp }
				</time>{" "}
				{ content }
			</li>
		);
	}
}

ChatLine.propTypes = {
	argument: PropTypes.string,
	by: PropTypes.string,
	channel: PropTypes.string,
	channelName: PropTypes.string,
	color: PropTypes.number,
	displayChannel: PropTypes.bool,
	displayContextLink: PropTypes.bool,
	displayUsername: PropTypes.bool,
	events: PropTypes.array,
	highlight: PropTypes.array,
	isAction: PropTypes.bool,
	lineId: PropTypes.string,
	message: PropTypes.string,
	mode: PropTypes.string,
	observer: PropTypes.object,
	reason: PropTypes.string,
	server: PropTypes.string,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatLine;
