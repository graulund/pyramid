import React, { PureComponent, PropTypes } from "react";
import moment from "moment";
import Linkify from "react-linkify";

import ChannelLink from "./ChannelLink.jsx";
import UserLink from "./UserLink.jsx";

const linkifyProperties = { target: "_blank" };

class ChatLine extends PureComponent {
	render() {
		const {
			channel, displayChannel, displayUsername,
			highlight, isAction, message, time, username
		} = this.props;

		const m = moment(time);
		const timestamp = m.format("H:mm:ss");
		const datestamp = m.format("YYYY-MM-DD");
		const isHighlight = !!(highlight && highlight.length);
		const className = "msg" +
			(isAction ? " msg--action" : "") +
			(isHighlight ? " msg--highlight" : "");

		return (
			<li className={className}>
				{ displayChannel
					? (
						<span className="msg__channel">
							<ChannelLink channel={channel} key={channel} />
							{" "}
						</span>
					) : null }
				<time dateTime={time} title={datestamp + " " + timestamp}>
					{ timestamp }
				</time>{" "}
				{ displayUsername
					? (
						<strong className="msg__author">
							<UserLink userName={username} key={username} />
							{" "}
						</strong>
					) : null }
				<span><Linkify properties={linkifyProperties}>
					{ message }
				</Linkify></span>
			</li>
		);
	}
}

ChatLine.propTypes = {
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
	username: PropTypes.string
};

export default ChatLine;
