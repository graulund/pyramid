import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatView from "./ChatView.jsx";
import NoChatView from "./NoChatView.jsx";
import { CATEGORY_NAMES } from "../constants";
import { channelUrlFromNames } from "../lib/channelNames";
import { parseLineIdHash } from "../lib/routeHelpers";

const VALID_CATEGORIES = Object.keys(CATEGORY_NAMES);

class ChatViewWrapper extends PureComponent {
	render() {
		const { location, match: { params } } = this.props;

		var pageType = "", pageQuery = "";

		if (params.channelName && params.serverName) {
			pageType = "channel";
			pageQuery = channelUrlFromNames(
				params.serverName, params.channelName
			);
		}
		else if (params.userName) {
			pageType = "user";
			pageQuery = params.userName;
		}
		else if (
			params.categoryName &&
			VALID_CATEGORIES.indexOf(params.categoryName) >= 0
		) {
			pageType = "category";
			pageQuery = params.categoryName;
		}

		if (!pageType) {
			return <NoChatView key="main" />;
		}

		const lineId = parseLineIdHash(location.hash);

		return <ChatView
			lineId={lineId}
			logDate={params.logDate}
			pageType={pageType}
			pageQuery={pageQuery}
			key="main" />;
	}
}

ChatViewWrapper.propTypes = {
	location: PropTypes.object,
	match: PropTypes.object
};

export default ChatViewWrapper;
