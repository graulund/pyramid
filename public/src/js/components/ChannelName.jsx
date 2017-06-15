import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getTwitchChannelDisplayNameData } from "../lib/displayNames";
import { parseChannelUri } from "../lib/channelNames";

class ChannelName extends Component {
	render() {
		const {
			channel,
			displayName,
			enableTwitchChannelDisplayNames,
			enableTwitchUserDisplayNames,
			multiServerChannels,
			serverData
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

		// If displaying Twitch display names

		if (serverData && serverData.isTwitch) {
			let displayNameData = getTwitchChannelDisplayNameData(
				channelName,
				displayName,
				enableTwitchChannelDisplayNames,
				enableTwitchUserDisplayNames
			);

			let { primary, secondary, tooltip } = displayNameData;
			displayedName = primary;
			title = tooltip;

			if (secondary) {
				suffix = [" ", <em key="secondary">({ secondary })</em>];
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
	serverData: PropTypes.object,
	strong: PropTypes.bool
};

const mapStateToProps = function(state, ownProps) {
	let {
		appConfig: {
			enableTwitchChannelDisplayNames,
			enableTwitchUserDisplayNames
		},
		multiServerChannels,
		serverData
	} = state;

	var server;

	if (ownProps.server) {
		server = ownProps.server;
	}
	else {
		let uriData = parseChannelUri(ownProps.channel);
		server = uriData && uriData.server;
	}

	return {
		enableTwitchChannelDisplayNames,
		enableTwitchUserDisplayNames,
		multiServerChannels,
		serverData: server && serverData[server]
	};
};

export default connect(mapStateToProps)(ChannelName);
