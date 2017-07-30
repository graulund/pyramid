import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import shallowEqual from "fbjs/lib/shallowEqual";

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

		this.contentUrl = this.contentUrl.bind(this);

		this.state = {
			loading: true
		};
	}

	componentWillMount() {
		this.requestDataIfNeeded(this.props);
	}

	shouldComponentUpdate(nextProps, nextState) {

		// Lock updates if window is not visible anyway
		if (!nextProps.isVisible) {
			return false;
		}

		// Default PureComponent behaviour
		return !shallowEqual(this.props, nextProps) ||
			!shallowEqual(this.state, nextState);
	}

	componentWillReceiveProps(newProps) {
		this.requestDataIfNeeded(newProps, this.props);
		this.cleanUpIfNeeded(newProps);
	}

	componentWillUnmount() {
		let { logDate, pageType, pageQuery } = this.props;

		if (!logDate) {
			let subject = subjectName(pageType, pageQuery);
			io.unsubscribeFromSubject(subject);
		}
	}

	contentUrl(date, pageNumber) {
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
		let subject = subjectName(pageType, pageQuery);
		let subscribed = true;

		if (logDate) {
			io.requestLogFile(subject, logDate, pageNumber);
		}
		else {
			subscribed = io.subscribeToSubject(subject);
		}

		io.requestLogDetails(subject, logDate);

		if (oldType && oldQuery && !oldLogDate) {
			const oldSubject = subjectName(oldType, oldQuery);
			io.unsubscribeFromSubject(oldSubject);
		}

		return subscribed;
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
			let subscribed = this.requestData(
				pageType, pageQuery, logDate, pageNumber,
				oldType, oldQuery, oldLogDate
			);
			this.setState({ loading: subscribed });
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

	getLastServerName(props = this.props) {
		let { lines } = props;

		if (lines && lines.length) {
			for (var i = lines.length - 1; i >= 0; i--) {
				let line = lines[i];

				if (line && line.server) {
					return line.server;
				}
			}
		}

		return null;
	}

	render() {
		const {
			connectionStatus,
			currentLayout,
			deviceFocus,
			displayName,
			focus,
			index,
			lines,
			logBrowserOpen,
			logDate,
			logDetails,
			offlineMessages,
			pageNumber,
			pageQuery,
			pageType,
			selectedLine,
			solo,
			userListOpen
		} = this.props;

		const { loading } = this.state;

		const loadingStyles = loading ? null : HIDDEN_STYLES;

		const isLiveChannel = this.isLiveChannel();

		const loader = (
			<div key="loader" style={loadingStyles}>
				<Loader className="loader mainview__loader" />
			</div>
		);

		const className = "mainview chatview" +
			(solo ? " chatview--solo" : "") +
			(isLiveChannel ? " chatview--live-channel" : "") +
			(logBrowserOpen || logDate ? " chatview--logbrowsing" : "") +
			(userListOpen && isLiveChannel ? " chatview--userlisting" : "");

		var deducedServerName;

		if (pageType === PAGE_TYPES.USER) {
			deducedServerName = this.getLastServerName();
		}

		return (
			<div className={className}>

				<ChatViewHeader
					displayName={displayName}
					index={index}
					isLiveChannel={isLiveChannel}
					logBrowserOpen={logBrowserOpen}
					logDate={logDate}
					logDetails={logDetails}
					logUrl={this.contentUrl}
					pageNumber={pageNumber}
					pageQuery={pageQuery}
					pageType={pageType}
					serverName={deducedServerName}
					key="header" />

				<ChatFrame
					connectionStatus={connectionStatus}
					currentLayout={currentLayout}
					inFocus={deviceFocus}
					isLiveChannel={isLiveChannel}
					lines={lines}
					loading={loading}
					logBrowserOpen={logBrowserOpen}
					logDate={logDate}
					offlineMessages={offlineMessages}
					pageQuery={pageQuery}
					pageType={pageType}
					selectedLine={selectedLine}
					userListOpen={userListOpen}
					key="chat" />

				<ChatViewFooter
					displayName={displayName}
					focus={focus}
					index={index}
					isLiveChannel={isLiveChannel}
					logDate={logDate}
					logDetails={logDetails}
					pageNumber={pageNumber}
					pageQuery={pageQuery}
					pageType={pageType}
					key="footer" />

				{ loader }

			</div>
		);
	}
}

ChatView.propTypes = {
	connectionStatus: PropTypes.object,
	currentLayout: PropTypes.array,
	deviceFocus: PropTypes.bool,
	displayName: PropTypes.string,
	focus: PropTypes.bool,
	index: PropTypes.number,
	isVisible: PropTypes.bool,
	lastReload: PropTypes.object,
	lineId: PropTypes.string,
	lines: PropTypes.array,
	logBrowserOpen: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	offlineMessages: PropTypes.object,
	pageNumber: PropTypes.number,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired,
	selectedLine: PropTypes.object,
	solo: PropTypes.bool,
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

	var lines, lastReload, offlineMessages;

	if (logDate) {
		const logCache = state.logFiles[subject];
		lines = logCache && logCache[logDate];
	}
	else {
		const cacheName = PAGE_TYPE_CACHE_MAP[pageType];
		const cacheData = state[cacheName][pageQuery];
		lines = cacheData && cacheData.cache;
		lastReload = cacheData && cacheData.lastReload;

		if (pageType === PAGE_TYPES.CHANNEL) {
			offlineMessages = state.offlineMessages[pageQuery];
		}
	}

	const displayName = getDisplayName(state, pageType, pageQuery);
	const selectedLine = lineId && state.lineInfo[lineId];
	const logDetails = state.logDetails[subject];

	return {
		connectionStatus: state.connectionStatus,
		currentLayout: state.viewState.currentLayout,
		displayName,
		deviceFocus: state.deviceState.inFocus,
		isVisible: state.deviceState.visible,
		lastReload,
		lines,
		logBrowserOpen: state.viewState.logBrowserOpen,
		logDetails,
		offlineMessages,
		selectedLine,
		userListOpen: state.viewState.userListOpen
	};
};

export default connect(mapStateToProps)(ChatView);
