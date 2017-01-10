import React, { Component, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router";
import moment from "moment";

import ChannelName from "./ChannelName.jsx";
import TimedItem from "./TimedItem.jsx";
import { internalUrl, formatTime } from "../lib/formatting";
import { channelNameFromUrl, channelServerNameFromUrl } from "../lib/channelNames";

class TimedChannelItem extends Component {

	render() {
		const { channel, displayServer = false, lastSeenData = {} } = this.props;

		const prefix = (
			<Link to={internalUrl("/channel/" + channel.toLowerCase())}>
				<ChannelName channel={channel} displayServer={displayServer} />
			</Link>
		);

		const suffix = lastSeenData && lastSeenData.username ? (
			<span className="msg">
				by <Link className="invisible"
					to={internalUrl("/user/" + lastSeenData.username.toLowerCase())}>
					{ lastSeenData.username }
				</Link>
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
