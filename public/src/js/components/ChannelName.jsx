import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";

import { channelNameFromUrl, channelServerNameFromUrl } from "../lib/channelNames";

class ChannelName extends Component {
	render() {
		const { channel, multiServerChannels } = this.props;
		var { displayServer = false, server } = this.props;

		// If the server argument is supplied, we assume this is already split up
		const channelName = server ? channel.replace(/^#*/, "#")
			: channelNameFromUrl(channel);
		server = server ? server : channelServerNameFromUrl(channel);

		if (
			!displayServer &&
			multiServerChannels.indexOf(channelName.replace(/^#/, "")) >= 0
		) {
			displayServer = true;
		}

		return (
			<span className="channelname">
				<strong>{ channelName }</strong>
				{ displayServer ? <span className="server"> on { server }</span> : null }
			</span>
		);
	}
}

ChannelName.propTypes = {
	channel: PropTypes.string.isRequired,
	displayServer: PropTypes.bool,
	server: PropTypes.string
};

export default connect(({ multiServerChannels }) => ({ multiServerChannels }))(ChannelName);
