import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { channelNameFromUrl, channelServerNameFromUrl } from "../lib/channelNames";

class ChannelName extends Component {
	render() {
		const { channel, displayName, multiServerChannels } = this.props;
		var { displayServer = false, server, strong } = this.props;

		if (!channel) {
			return null;
		}

		// If the server argument is supplied, we assume this is already split up
		let channelName = (
			server
				? channel.replace(/^#*/, "#")
				: channelNameFromUrl(channel)
		);

		let displayedName = displayName || channelName;
		let title = displayName &&
			displayName.toLowerCase() !== channelName.toLowerCase()
			? channelName : undefined;

		server = server || channelServerNameFromUrl(channel);

		if (
			!displayServer &&
			multiServerChannels.indexOf(channelName.replace(/^#/, "")) >= 0
		) {
			displayServer = true;
		}

		let main = strong ? <strong>{ displayedName }</strong> : displayedName;

		return (
			<span className="channelname" title={title}>
				{ main }
				{ displayServer ? <span className="server"> on { server }</span> : null }
			</span>
		);
	}
}

ChannelName.propTypes = {
	channel: PropTypes.string.isRequired,
	displayName: PropTypes.string,
	displayServer: PropTypes.bool,
	multiServerChannels: PropTypes.array,
	server: PropTypes.string,
	strong: PropTypes.bool
};

export default connect(({ multiServerChannels }) => ({ multiServerChannels }))(ChannelName);
