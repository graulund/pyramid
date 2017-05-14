import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import ChannelName from "./ChannelName.jsx";
import { channelUrl } from "../lib/routeHelpers";

class ChannelLink extends PureComponent {
	render() {
		const {
			channel,
			displayName,
			displayServer,
			server,
			strong
		} = this.props;

		if (!channel) {
			return null;
		}

		return (
			<Link className="invisible" to={channelUrl(channel)}>
				<ChannelName
					channel={channel}
					displayName={displayName}
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
	displayName: PropTypes.string,
	displayServer: PropTypes.bool,
	server: PropTypes.string,
	strong: PropTypes.bool
};

export default ChannelLink;
