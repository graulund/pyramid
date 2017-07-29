import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import { PAGE_TYPES } from "../constants";
import ChannelName from "./ChannelName.jsx";
import ChatViewLink from "./ChatViewLink.jsx";

class ChannelLink extends PureComponent {
	render() {
		const {
			channel,
			displayName,
			displayServer,
			noConversationName,
			server,
			strong
		} = this.props;

		if (!channel) {
			return null;
		}

		return (
			<ChatViewLink
				type={PAGE_TYPES.CHANNEL}
				query={channel}
				className="channellink">
				<ChannelName
					noUserLink
					channel={channel}
					displayName={displayName}
					displayServer={displayServer}
					noConversationName={noConversationName}
					server={server}
					strong={strong}
					/>
			</ChatViewLink>
		);
	}
}

ChannelLink.propTypes = {
	channel: PropTypes.string.isRequired,
	displayName: PropTypes.string,
	displayServer: PropTypes.bool,
	noConversationName: PropTypes.bool,
	server: PropTypes.string,
	strong: PropTypes.bool
};

export default ChannelLink;
