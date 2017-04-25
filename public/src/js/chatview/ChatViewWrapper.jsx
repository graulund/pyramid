import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatView from "./ChatView.jsx";
import { channelUrlFromNames } from "../lib/channelNames";
import { parseLineIdHash } from "../lib/routeHelpers";

class ChatViewWrapper extends PureComponent {
	render() {
		const { location, params } = this.props;

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
		else if (params.categoryName) {
			pageType = "category";
			pageQuery = params.categoryName;
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
	params: PropTypes.object
};

export default ChatViewWrapper;
