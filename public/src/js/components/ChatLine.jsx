import React, { PureComponent, PropTypes } from "react";
import moment from "moment";

import ChannelLink from "./ChannelLink.jsx";
import ChatBunchedEventsLine from "./ChatBunchedEventsLine.jsx";
import ChatMessageLine from "./ChatMessageLine.jsx";
import ChatUserEventLine from "./ChatUserEventLine.jsx";

class ChatLine extends PureComponent {
	render() {
		const { channel, displayChannel, highlight, time, type } = this.props;

		const m = moment(time);
		const timestamp = m.format("H:mm:ss");
		const datestamp = m.format("YYYY-MM-DD");

		const isHighlight = !!(highlight && highlight.length);
		const className = "line" +
			(isHighlight ? " line--highlight" : "");

		var content = null;

		switch (type) {
			case "msg":
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

		return (
			<li className={className}>
				{ displayChannel
					? (
						<span className="line__channel">
							<ChannelLink channel={channel} key={channel} />
							{" "}
						</span>
					) : null }
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
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	events: PropTypes.array,
	highlight: PropTypes.array,
	id: PropTypes.string,
	isAction: PropTypes.bool,
	message: PropTypes.string,
	mode: PropTypes.string,
	reason: PropTypes.string,
	server: PropTypes.string,
	symbol: PropTypes.string,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatLine;
