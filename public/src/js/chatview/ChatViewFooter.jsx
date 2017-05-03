import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatInput from "./ChatInput.jsx";
import ChatViewLogPagination from "./ChatViewLogPagination.jsx";

class ChatViewFooter extends PureComponent {
	render() {
		const {
			isLiveChannel,
			logDate,
			logDetails,
			logUrl,
			pageNumber,
			pageQuery
		} = this.props;

		if (isLiveChannel) {
			return <ChatInput
				channel={pageQuery}
				key="bottom" />;
		}
		else if (logDate) {
			return <ChatViewLogPagination
				logDate={logDate}
				logDetails={logDetails}
				logUrl={logUrl}
				pageNumber={pageNumber}
				key="pagination" />;
		}

		return null;
	}
}

ChatViewFooter.propTypes = {
	isLiveChannel: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	logUrl: PropTypes.func,
	pageNumber: PropTypes.number,
	pageQuery: PropTypes.string.isRequired
};

export default ChatViewFooter;
