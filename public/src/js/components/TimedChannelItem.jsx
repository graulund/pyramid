import React, { Component, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router";
import moment from "moment";

import TimedItem from "./TimedItem.jsx";
import { internalUrl, formatTime } from "../lib/formatting";
import { channelNameFromUrl, channelServerNameFromUrl } from "../lib/channelNames";

class TimedChannelItem extends Component {

	render() {
		const { channel, lastSeenData = {}, multiServerChannels } = this.props;
		var { displayServer = false } = this.props;

		const channelName = channelNameFromUrl(channel);
		const server = channelServerNameFromUrl(channel);

		if (
			!displayServer &&
			multiServerChannels.indexOf(channelName.replace(/^#/, "")) >= 0
		) {
			displayServer = true;
		}

		const prefix = (
			<Link to={internalUrl("/channel/" + channel.toLowerCase())}>
				<strong>{ channelName }</strong>
				{ displayServer ? <span className="server">on { server }</span> : null }
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

		// TODO: Include server name if there are two channels of
		// the same name on two different servers

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
	multiServerChannels: PropTypes.array,
	lastSeenData: PropTypes.object
};

export default connect(({ multiServerChannels }) => ({ multiServerChannels }))(TimedChannelItem);
