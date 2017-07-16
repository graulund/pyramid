import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatInput from "./ChatInput.jsx";
import ChatViewLogPagination from "./ChatViewLogPagination.jsx";

class ChatViewFooter extends PureComponent {
	render() {
		const {
			displayName,
			focus,
			index,
			isLiveChannel,
			logDate,
			logDetails,
			pageNumber,
			pageQuery,
			pageType
		} = this.props;

		if (isLiveChannel) {
			return <ChatInput
				channel={pageQuery}
				displayName={displayName}
				index={index}
				viewFocus={focus}
				key="input" />;
		}
		else if (logDate) {
			return <ChatViewLogPagination
				logDate={logDate}
				logDetails={logDetails}
				pageNumber={pageNumber}
				pageQuery={pageQuery}
				pageType={pageType}
				key="pagination" />;
		}

		return null;
	}
}

ChatViewFooter.propTypes = {
	displayName: PropTypes.string,
	focus: PropTypes.bool,
	index: PropTypes.number,
	isLiveChannel: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	pageNumber: PropTypes.number,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.string.isRequired
};

export default ChatViewFooter;
