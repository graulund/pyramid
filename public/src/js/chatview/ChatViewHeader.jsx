import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import values from "lodash/values";

import ChannelName from "../components/ChannelName.jsx";
import ChatViewLogBrowser from "./ChatViewLogBrowser.jsx";
import ChatUserListControl from "./ChatUserListControl.jsx";
import { CATEGORY_NAMES, PAGE_TYPES } from "../constants";
import { storeViewState } from "../lib/io";
import { subjectUrl } from "../lib/routeHelpers";
import store from "../store";
import actions from "../actions";

const PAGE_TYPE_NAMES = values(PAGE_TYPES);

class ChatViewHeader extends PureComponent {
	constructor(props) {
		super(props);

		this.contentLogUrl = this.contentLogUrl.bind(this);
		this.closeLogBrowser = this.closeLogBrowser.bind(this);
		this.openLogBrowser = this.openLogBrowser.bind(this);
	}

	contentLiveUrl() {
		const { pageType, pageQuery } = this.props;
		return subjectUrl(pageType, pageQuery);
	}

	contentLogUrl(date) {
		const { pageType, pageQuery } = this.props;
		return subjectUrl(pageType, pageQuery, date);
	}

	isLiveChannel() {
		const { logDate, pageType } = this.props;
		return pageType === PAGE_TYPES.CHANNEL && !logDate;
	}

	setViewState(update) {
		store.dispatch(actions.viewState.update(update));
		storeViewState(update);
	}

	closeLogBrowser() {
		this.setViewState({ logBrowserOpen: false });
	}

	openLogBrowser() {
		this.setViewState({ logBrowserOpen: true });
	}

	renderControls() {
		const { logBrowserOpen, logDate, pageQuery, pageType } = this.props;

		if (
			pageType !== PAGE_TYPES.CHANNEL &&
			pageType !== PAGE_TYPES.USER
		) {
			// Not loggable
			return null;
		}

		var logBrowserToggler = null;

		if (logDate) {
			logBrowserToggler = (
				<Link to={this.contentLiveUrl()}>
					Live
				</Link>
			);
		} else {
			if (logBrowserOpen) {
				logBrowserToggler = (
					<a href="javascript://"
						onClick={this.closeLogBrowser}
						key="logControl">
						Close
					</a>
				);
			} else {
				logBrowserToggler = (
					<a href="javascript://"
						onClick={this.openLogBrowser}
						key="logControl">
						Logs
					</a>
				);
			}
		}

		var userListToggler = null;

		if (this.isLiveChannel()) {
			userListToggler = (
				<li key="userlist">
					<ChatUserListControl
						channel={pageQuery}
						key="user-list-control" />
				</li>
			);
		}

		return (
			<ul className="controls chatview__controls">
				{ userListToggler }
				<li key="logbrowser">
					{ logBrowserToggler }
				</li>
			</ul>
		);
	}

	renderLogBrowser() {
		const { logBrowserOpen, logDate, logDetails } = this.props;

		if (logBrowserOpen || logDate) {
			return <ChatViewLogBrowser
				logDate={logDate}
				logDetails={logDetails}
				logUrl={this.contentLogUrl}
				key="logbrowser" />;
		}

		return null;
	}

	render() {
		const { pageQuery, pageType } = this.props;

		var heading = null;

		switch (pageType) {
			case PAGE_TYPES.CATEGORY:
				heading = CATEGORY_NAMES[pageQuery] || null;
				break;
			case PAGE_TYPES.CHANNEL:
				heading = <ChannelName
					channel={pageQuery}
					key={pageQuery} />;
				break;
			case PAGE_TYPES.USER:
				heading = pageQuery;
		}

		const controls = this.renderControls();
		const logBrowser = this.renderLogBrowser();

		return (
			<div className="mainview__top" key="top">
				<div className="mainview__top__main" key="topMain">
					<h2>{ heading }</h2>
					{ controls }
				</div>
				{ logBrowser }
			</div>
		);
	}
}

ChatViewHeader.propTypes = {
	logBrowserOpen: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired
};

export default ChatViewHeader;
