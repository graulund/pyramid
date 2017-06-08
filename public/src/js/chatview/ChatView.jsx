import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChannelUserList from "./ChannelUserList.jsx";
import ChatFrame from "./ChatFrame.jsx";
import ChatViewFooter from "./ChatViewFooter.jsx";
import ChatViewHeader from "./ChatViewHeader.jsx";
import Loader from "../components/Loader.jsx";
import { PAGE_TYPES, PAGE_TYPE_NAMES } from "../constants";
import { getChannelDisplayNameFromState } from "../lib/channelNames";
import * as io from "../lib/io";
import { subjectName, subjectUrl } from "../lib/routeHelpers";
import store from "../store";
import actions from "../actions";

const PAGE_TYPE_CACHE_MAP = {
	[PAGE_TYPES.CATEGORY]: "categoryCaches",
	[PAGE_TYPES.CHANNEL]: "channelCaches",
	[PAGE_TYPES.USER]: "userCaches"
};

const HIDDEN_STYLES = { display: "none" };

class ChatView extends PureComponent {
	constructor(props) {
		super(props);

		this.contentLogUrl = this.contentLogUrl.bind(this);

		this.state = {
			loading: true
		};
	}

	componentWillMount() {
		this.requestDataIfNeeded(this.props);
	}

	componentWillReceiveProps(newProps) {
		this.requestDataIfNeeded(newProps, this.props);
		this.cleanUpIfNeeded(newProps);
	}

	contentLiveUrl() {
		const { pageType, pageQuery } = this.props;
		return subjectUrl(pageType, pageQuery);
	}

	contentLogUrl(date, pageNumber) {
		const { pageType, pageQuery } = this.props;
		return subjectUrl(pageType, pageQuery, date, pageNumber);
	}

	isLiveChannel() {
		const { logDate, pageType } = this.props;
		return pageType === PAGE_TYPES.CHANNEL && !logDate;
	}

	requestData(
		pageType, pageQuery, logDate, pageNumber,
		oldType, oldQuery, oldLogDate
	) {
		const subject = subjectName(pageType, pageQuery);

		if (logDate) {
			io.requestLogFile(subject, logDate, pageNumber);
		}
		else {
			io.subscribeToSubject(subject);
		}

		io.requestLogDetails(subject, logDate);

		if (oldType && oldQuery && !oldLogDate) {
			const oldSubject = subjectName(oldType, oldQuery);
			io.unsubscribeFromSubject(oldSubject);
		}
	}

	requestDataIfNeeded(props = this.props, oldProps = {}) {
		const {
			lastReload,
			lines,
			logDate,
			pageNumber,
			pageQuery,
			pageType
		} = props;

		const {
			lastReload: oldLastReload,
			lines: oldLines,
			logDate: oldLogDate,
			pageNumber: oldPageNumber,
			pageQuery: oldQuery,
			pageType: oldType
		} = oldProps;

		const { loading } = this.state;

		if (
			pageQuery !== oldQuery ||
			pageType !== oldType ||
			logDate !== oldLogDate ||
			pageNumber !== oldPageNumber
		) {
			// Time to request data
			this.requestData(
				pageType, pageQuery, logDate, pageNumber,
				oldType, oldQuery, oldLogDate
			);
			this.setState({ loading: true });
		}

		else if (
			loading &&
			(
				lastReload !== oldLastReload ||
				lines !== oldLines
			) &&
			pageQuery === oldQuery &&
			pageType === oldType &&
			logDate === oldLogDate &&
			pageNumber === oldPageNumber
		) {
			// Finished loading
			this.setState({ loading: false });
		}
	}

	cleanUpIfNeeded(props = this.props) {
		const { pageType, logBrowserOpen, userListOpen } = props;

		if (
			pageType === PAGE_TYPES.CATEGORY &&
			(logBrowserOpen || userListOpen)
		) {
			store.dispatch(actions.viewState.update(
				{ logBrowserOpen: false, userListOpen: false }
			));
		}
	}

	render() {
		const {
			collapseJoinParts,
			displayName,
			inFocus,
			lines,
			logBrowserOpen,
			logDate,
			logDetails,
			pageNumber,
			pageQuery,
			pageType,
			selectedLine,
			userListOpen
		} = this.props;

		const { loading } = this.state;

		const loadingStyles = loading ? null : HIDDEN_STYLES;

		const liveUrl = this.contentLiveUrl();
		const isLiveChannel = this.isLiveChannel();

		var userList = null;

		if (isLiveChannel && userListOpen) {
			userList = <ChannelUserList
				channel={pageQuery}
				key="userList" />;
		}

		const loader = (
			<div key="loader" style={loadingStyles}>
				<Loader className="loader mainview__loader" />
			</div>
		);

		const className = "mainview chatview" +
			(isLiveChannel ? " chatview--live-channel" : "") +
			(logBrowserOpen || logDate ? " chatview--logbrowsing" : "") +
			(userListOpen && isLiveChannel ? " chatview--userlisting" : "");

		return (
			<div className={className}>

				<ChatViewHeader
					displayName={displayName}
					isLiveChannel={isLiveChannel}
					liveUrl={liveUrl}
					logBrowserOpen={logBrowserOpen}
					logDate={logDate}
					logDetails={logDetails}
					logUrl={this.contentLogUrl}
					pageQuery={pageQuery}
					pageType={pageType}
					key="header" />

				<ChatFrame
					collapseJoinParts={collapseJoinParts}
					inFocus={inFocus}
					lines={lines}
					loading={loading}
					logBrowserOpen={logBrowserOpen}
					logDate={logDate}
					pageQuery={pageQuery}
					pageType={pageType}
					selectedLine={selectedLine}
					userListOpen={userListOpen}
					key="chat" />

				<ChatViewFooter
					displayName={displayName}
					isLiveChannel={isLiveChannel}
					logDate={logDate}
					logDetails={logDetails}
					logUrl={this.contentLogUrl}
					pageNumber={pageNumber}
					pageQuery={pageQuery}
					key="footer" />

				{ userList }
				{ loader }

			</div>
		);
	}
}

ChatView.propTypes = {
	collapseJoinParts: PropTypes.bool,
	displayName: PropTypes.string,
	inFocus: PropTypes.bool,
	lastReload: PropTypes.object,
	lineId: PropTypes.string,
	lines: PropTypes.array,
	logBrowserOpen: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	pageNumber: PropTypes.number,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired,
	selectedLine: PropTypes.object,
	userListOpen: PropTypes.bool
};

const getDisplayName = function(state, pageType, pageQuery) {
	if (pageType === PAGE_TYPES.CHANNEL) {
		return getChannelDisplayNameFromState(state, pageQuery);
	}

	else if (pageType === PAGE_TYPES.USER) {
		let ls = state.lastSeenUsers[pageQuery];
		if (ls) {
			return ls.displayName;
		}
	}
};

const mapStateToProps = function(state, ownProps) {
	const { lineId, logDate, pageQuery, pageType } = ownProps;
	const subject = subjectName(pageType, pageQuery);

	var lines, lastReload;

	if (logDate) {
		const logCache = state.logFiles[subject];
		lines = logCache && logCache[logDate];
	}
	else {
		const cacheName = PAGE_TYPE_CACHE_MAP[pageType];
		const cacheData = state[cacheName][pageQuery];
		lines = cacheData && cacheData.cache;
		lastReload = cacheData && cacheData.lastReload;
	}

	const displayName = getDisplayName(state, pageType, pageQuery);
	const selectedLine = lineId && state.lineInfo[lineId];
	const logDetails = state.logDetails[subject];

	return {
		collapseJoinParts: state.appConfig.collapseJoinParts,
		displayName,
		inFocus: state.deviceState.inFocus,
		lastReload,
		lines,
		logBrowserOpen: state.viewState.logBrowserOpen,
		logDetails,
		selectedLine,
		userListOpen: state.viewState.userListOpen
	};
};

export default connect(mapStateToProps)(ChatView);
