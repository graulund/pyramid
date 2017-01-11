import React, { Component, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router";
import moment from "moment";

import ChannelLink from "./ChannelLink.jsx";
import TimedItem from "./TimedItem.jsx";
import UserLink from "./UserLink.jsx";
import { internalUrl, formatTime } from "../lib/formatting";
import { channelNameFromUrl, channelServerNameFromUrl } from "../lib/channelNames";

class TimedChannelItem extends Component {

	render() {
		const { channel, displayServer = false, lastSeenData = {} } = this.props;

		const prefix = <ChannelLink
			strong
			channel={channel}
			displayServer={displayServer}
			key={channel}
			/>;

		const suffix = lastSeenData && lastSeenData.username ? (
			<span className="msg">
				by <UserLink
					userName={lastSeenData.username}
					className="invisible"
					key={lastSeenData.username}
					/>
			</span>
		) : null;

		return <TimedItem
				time={lastSeenData.time}
				skipOld={false}
				prefix={prefix}
				suffix={suffix}
				/>;
	}
}

TimedChannelItem.propTypes = {
	channel: PropTypes.string,
	displayServer: PropTypes.bool,
	lastSeenData: PropTypes.object
};

export default TimedChannelItem;
