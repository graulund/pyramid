import React, { PureComponent, PropTypes } from "react";
import { Link } from "react-router";

import ChannelName from "./ChannelName.jsx";
import { internalUrl } from "../lib/formatting";

class ChannelLink extends PureComponent {
	render() {
		const { channel, displayServer, server, strong } = this.props;

		if (!channel) {
			return null;
		}

		return (
			<Link className="invisible" to={internalUrl("/channel/" + channel)}>
				<ChannelName
					channel={channel}
					displayServer={displayServer}
					server={server}
					strong={strong}
					/>
			</Link>
		);
	}
}

ChannelLink.propTypes = {
	channel: PropTypes.string.isRequired,
	channelName: PropTypes.string,
	displayServer: PropTypes.bool,
	server: PropTypes.string,
	strong: PropTypes.bool
};

export default ChannelLink;
