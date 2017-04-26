import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import values from "lodash/values";

import ChannelUserList from "./ChannelUserList.jsx";
import ChatFrame from "./ChatFrame.jsx";
import ChatInput from "./ChatInput.jsx";
import ChatViewHeader from "./ChatViewHeader.jsx";
import Loader from "../components/Loader.jsx";
import { PAGE_TYPES } from "../constants";
import * as io from "../lib/io";
import { subjectName } from "../lib/routeHelpers";

const PAGE_TYPE_NAMES = values(PAGE_TYPES);

const PAGE_TYPE_CACHE_MAP = {
	[PAGE_TYPES.CATEGORY]: "categoryCaches",
	[PAGE_TYPES.CHANNEL]: "channelCaches",
	[PAGE_TYPES.USER]: "userCaches"
};

const HIDDEN_STYLES = { display: "none" };

class ChatView extends PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			loading: true
		};
	}

	componentWillMount() {
		this.requestDataIfNeeded(this.props);
	}

	componentWillReceiveProps(newProps) {
		this.requestDataIfNeeded(newProps, this.props);
	}

	isLiveChannel() {
		const { logDate, pageType } = this.props;
		return pageType === PAGE_TYPES.CHANNEL && !logDate;
	}

	requestData(
		pageType, pageQuery, logDate,
		oldType, oldQuery, oldLogDate
	) {
		const subject = subjectName(pageType, pageQuery);

		if (logDate) {
			io.requestLogFile(subject, logDate);
		}
		else {
			io.subscribeToSubject(subject);
			io.requestLogDetails(subject);
		}

		if (oldType && oldQuery && !oldLogDate) {
			const oldSubject = subjectName(oldType, oldQuery);
			io.unsubscribeFromSubject(oldSubject);
		}
	}

	requestDataIfNeeded(props = this.props, oldProps = {}) {
		const {
			lines,
			logDate,
			pageQuery,
			pageType
		} = props;
		const {
			lines: oldLines,
			logDate: oldLogDate,
			pageQuery: oldQuery,
			pageType: oldType
		} = oldProps;
		const { loading } = this.state;

		if (
			pageQuery !== oldQuery ||
			pageType !== oldType ||
			logDate !== oldLogDate
		) {
			// Time to request data
			this.requestData(
				pageType, pageQuery, logDate,
				oldType, oldQuery, oldLogDate
			);
			this.setState({ loading: true });
		}

		else if (
			lines !== oldLines &&
			!oldLines &&
			pageQuery === oldQuery &&
			pageType === oldType &&
			logDate === oldLogDate
		) {
			// Finished loading
			this.setState({ loading: false });
		}

		else if (loading) {
			this.setState({ loading: false });
		}
	}

	render() {
		const {
			lines,
			logBrowserOpen,
			logDate,
			logDetails,
			pageQuery,
			pageType,
			selectedLine,
			userListOpen
		} = this.props;

		const { loading } = this.state;

		const loadingStyles = loading ? null : HIDDEN_STYLES;

		const isLiveChannel = this.isLiveChannel();

		var input = null, userList = null;

		if (isLiveChannel) {
			input = <ChatInput
				channel={pageQuery}
				key="input" />;

			if (userListOpen) {
				userList = <ChannelUserList
					channel={pageQuery}
					key="userList" />;
			}
		}

		const loader = (
			<div key="loader" style={loadingStyles}>
				<Loader className="loader mainview__loader" />
			</div>
		);

		const className = "mainview chatview" +
			(isLiveChannel ? " chatview--live-channel" : "") +
			(logBrowserOpen ? " chatview--logbrowsing" : "") +
			(userListOpen && isLiveChannel ? " chatview--userlisting" : "");

		return (
			<div className={className}>
				<ChatViewHeader
					logBrowserOpen={logBrowserOpen}
					logDate={logDate}
					logDetails={logDetails}
					pageQuery={pageQuery}
					pageType={pageType}
					key="header" />
				<ChatFrame
					lines={lines}
					logBrowserOpen={logBrowserOpen}
					logDate={logDate}
					pageQuery={pageQuery}
					pageType={pageType}
					selectedLine={selectedLine}
					userListOpen={userListOpen}
					key="chat" />
				{ input }
				{ userList }
				{ loader }
			</div>
		);
	}
}

ChatView.propTypes = {
	lineId: PropTypes.string,
	lines: PropTypes.array,
	logBrowserOpen: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired,
	selectedLine: PropTypes.object,
	userListOpen: PropTypes.bool
};

const mapStateToProps = function(state, ownProps) {
	const { lineId, logDate, pageQuery, pageType } = ownProps;
	const subject = subjectName(pageType, pageQuery);

	var lines;

	if (logDate) {
		const logCache = state.logFiles[subject];
		lines = logCache && logCache[logDate];
	}
	else {
		const cacheName = PAGE_TYPE_CACHE_MAP[pageType];
		lines = state[cacheName][pageQuery];
	}

	const selectedLine = lineId && state.lineInfo[lineId];
	const logDetails = state.logDetails[subject];

	return {
		lines,
		logBrowserOpen: state.viewState.logBrowserOpen,
		logDetails,
		selectedLine,
		userListOpen: state.viewState.userListOpen
	};
};

export default connect(mapStateToProps)(ChatView);
