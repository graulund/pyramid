import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatView from "./ChatView.jsx";
import NoChatView from "./NoChatView.jsx";
import { CATEGORY_NAMES } from "../constants";
import { getChannelUri, getPrivateConversationUri } from "../lib/channelNames";
import { getMyIrcNick } from "../lib/connectionStatus";
import { reportConversationAsSeenIfNeeded } from "../lib/conversations";
import { getChannelInfoByNames } from "../lib/ircConfigs";
import { parseLineIdHash } from "../lib/routeHelpers";
import { getUserInfo } from "../lib/users";

const VALID_CATEGORIES = Object.keys(CATEGORY_NAMES);

class ChatViewWrapper extends PureComponent {
	render() {
		const { location, match: { params, url } } = this.props;

		const {
			categoryName,
			channelName,
			logDate,
			pageNumber,
			serverName,
			username
		} = params;

		var pageType, pageQuery;

		if (
			channelName && serverName &&
			getChannelInfoByNames(serverName, channelName)
		) {
			pageType = "channel";
			pageQuery = getChannelUri(serverName, channelName);
		}
		else if (username) {
			// Different behaviour dependent on the route
			let route = (url.match(/^\/([a-z]+)/) || [])[1];

			if (route === "user" && getUserInfo(username)) {
				pageType = route;
				pageQuery = username;
			}

			else if (route === "conversation") {
				let myNick = getMyIrcNick(serverName);

				if (myNick && myNick !== username) {
					pageType = "channel";
					pageQuery = getPrivateConversationUri(
						serverName, username
					);
					reportConversationAsSeenIfNeeded(serverName, username);
				}
			}
		}
		else if (
			categoryName &&
			VALID_CATEGORIES.indexOf(categoryName) >= 0
		) {
			pageType = "category";
			pageQuery = categoryName;
		}

		if (!pageType) {
			return <NoChatView notFound={url !== "/"} key="main" />;
		}

		const lineId = parseLineIdHash(location.hash);

		return (
			<ChatView
				focus
				solo
				lineId={lineId}
				logDate={logDate}
				pageNumber={+pageNumber || 1}
				pageQuery={pageQuery}
				pageType={pageType}
				key="main" />
		);
	}
}

ChatViewWrapper.propTypes = {
	location: PropTypes.object,
	match: PropTypes.object
};

export default ChatViewWrapper;
