import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatView from "./ChatView.jsx";
import NoChatView from "./NoChatView.jsx";
import { CATEGORY_NAMES } from "../constants";
import { getChannelUri } from "../lib/channelNames";
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

		var pageType = "", pageQuery = "";

		if (
			channelName && serverName &&
			getChannelInfoByNames(serverName, channelName)
		) {
			pageType = "channel";
			pageQuery = getChannelUri(serverName, channelName);
		}
		else if (username && getUserInfo(username)) {
			pageType = "user";
			pageQuery = username;
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

		return <ChatView
			lineId={lineId}
			logDate={logDate}
			pageNumber={+pageNumber || 1}
			pageQuery={pageQuery}
			pageType={pageType}
			key="main" />;
	}
}

ChatViewWrapper.propTypes = {
	location: PropTypes.object,
	match: PropTypes.object
};

export default ChatViewWrapper;
