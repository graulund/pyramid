import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { TWITCH_DISPLAY_NAMES } from "../constants";
import { parseChannelUri } from "../lib/channelNames";

class ChannelName extends Component {
	render() {
		const {
			channel,
			displayName,
			enableTwitchChannelDisplayNames,
			enableTwitchUserDisplayNames,
			multiServerChannels
		} = this.props;
		var { displayServer = false, server, strong } = this.props;

		if (!channel) {
			return null;
		}

		let uriData = parseChannelUri(channel);

		// If the server argument is supplied, we assume this is already split up
		let channelName = (
			server
				? channel.replace(/^#*/, "#")
				: uriData && "#" + uriData.channel
		);

		let displayedName = channelName;
		let title = undefined;
		let suffix = null;

		let twitchChannelIsUser = channelName.substr(0,2) !== "#_";

		// If displaying display name

		if (
			enableTwitchChannelDisplayNames &&
			displayName &&
			displayName !== channelName
		) {
			if (displayName.toLowerCase() !== channelName.toLowerCase()) {
				// Totally different altogether
				// Different behaviour if it's a user versus a group chat
				if (!twitchChannelIsUser) {
					displayedName = displayName;
					title = channelName;
				}
				else if (enableTwitchUserDisplayNames === TWITCH_DISPLAY_NAMES.ALL) {
					displayedName = displayName;
					title = channelName;
					suffix = [
						" ",
						<em key="origName">({ channelName })</em>
					];
				}
			}
			else {
				// Merely case changes
				if (!twitchChannelIsUser || enableTwitchUserDisplayNames) {
					displayedName = displayName;
				}
			}
		}

		server = server || uriData && uriData.server;

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
				{ suffix }
				{ displayServer ? <span className="server"> on { server }</span> : null }
			</span>
		);
	}
}

ChannelName.propTypes = {
	channel: PropTypes.string.isRequired,
	displayName: PropTypes.string,
	displayServer: PropTypes.bool,
	enableTwitchChannelDisplayNames: PropTypes.bool,
	enableTwitchUserDisplayNames: PropTypes.number,
	multiServerChannels: PropTypes.array,
	server: PropTypes.string,
	strong: PropTypes.bool
};

export default connect(({
	appConfig: {
		enableTwitchChannelDisplayNames,
		enableTwitchUserDisplayNames
	},
	multiServerChannels
}) => ({
	enableTwitchChannelDisplayNames,
	enableTwitchUserDisplayNames,
	multiServerChannels
}))(ChannelName);
