import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import ChannelName from "./ChannelName.jsx";
import { parseChannelUri } from "../lib/channelNames";
import { getConversationData } from "../lib/displayNames";
import { channelUrl, conversationUrl } from "../lib/routeHelpers";

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

		const uriData = parseChannelUri(channel);
		const conversationData = uriData && getConversationData(uriData);
		var url;

		if (conversationData) {
			let { username, server } = conversationData;
			url = conversationUrl(server, username);
		}

		else {
			url = channelUrl(channel);
		}

		return (
			<Link className="channellink" to={url}>
				<ChannelName
					noUserLink
					channel={channel}
					displayName={displayName}
					displayServer={displayServer}
					noConversationName={noConversationName}
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
	noConversationName: PropTypes.bool,
	server: PropTypes.string,
	strong: PropTypes.bool
};

export default ChannelLink;
