import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import ChannelName from "../components/ChannelName.jsx";
import ChatHighlightsControls from "./ChatHighlightsControls.jsx";
import ChatSystemLogControls from "./ChatSystemLogControls.jsx";
import ChatViewLogBrowser from "./ChatViewLogBrowser.jsx";
import ChatUserListControl from "./ChatUserListControl.jsx";
import UserLink from "../components/UserLink.jsx";
import { CATEGORY_NAMES, PAGE_TYPES, PAGE_TYPE_NAMES } from "../constants";
import { storeViewState } from "../lib/io";
import { conversationUrl } from "../lib/routeHelpers";
import store from "../store";
import actions from "../actions";

class ChatViewHeader extends PureComponent {
	constructor(props) {
		super(props);

		this.closeLogBrowser = this.closeLogBrowser.bind(this);
		this.openLogBrowser = this.openLogBrowser.bind(this);
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
		const {
			isLiveChannel,
			liveUrl,
			logBrowserOpen,
			logDate,
			pageQuery,
			pageType,
			serverName
		} = this.props;

		if (pageType === PAGE_TYPES.CATEGORY) {
			if (pageQuery === "highlights") {
				return <ChatHighlightsControls key="highlightsControls" />;
			}

			else if (pageQuery === "system") {
				return <ChatSystemLogControls key="systemlogcontrols" />;
			}
		}

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
				<Link to={liveUrl}>
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
		var conversationLink = null;

		if (isLiveChannel) {
			userListToggler = (
				<li key="userlist">
					<ChatUserListControl
						channel={pageQuery}
						key="user-list-control" />
				</li>
			);
		}

		else if (pageType === PAGE_TYPES.USER && serverName) {
			conversationLink = (
				<li key="conversationlink">
					<Link to={conversationUrl(serverName, pageQuery)}>
						Conversation
					</Link>
				</li>
			);
		}

		// These are mutually exclusive
		let firstButton = userListToggler || conversationLink;

		return (
			<ul className="controls chatview__controls">
				{ firstButton }
				<li key="logbrowser">
					{ logBrowserToggler }
				</li>
			</ul>
		);
	}

	renderLogBrowser() {
		const { logBrowserOpen, logDate, logDetails, logUrl } = this.props;

		if (logBrowserOpen || logDate) {
			return <ChatViewLogBrowser
				logDate={logDate}
				logDetails={logDetails}
				logUrl={logUrl}
				key="logbrowser" />;
		}

		return null;
	}

	render() {
		const { displayName, pageQuery, pageType } = this.props;

		var heading = null;

		switch (pageType) {
			case PAGE_TYPES.CATEGORY:
				heading = CATEGORY_NAMES[pageQuery] || null;
				break;
			case PAGE_TYPES.CHANNEL:
				heading = <ChannelName
					channel={pageQuery}
					displayName={displayName}
					key={pageQuery} />;
				break;
			case PAGE_TYPES.USER:
				heading = <UserLink
					noLink
					username={pageQuery}
					displayName={displayName}
					key={pageQuery} />;
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
	displayName: PropTypes.string,
	isLiveChannel: PropTypes.bool,
	liveUrl: PropTypes.string,
	logBrowserOpen: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	logUrl: PropTypes.func,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired,
	serverName: PropTypes.string
};

export default ChatViewHeader;
