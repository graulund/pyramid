import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChannelName from "../components/ChannelName.jsx";
import ChatHighlightsControls from "./ChatHighlightsControls.jsx";
import ChatSystemLogControls from "./ChatSystemLogControls.jsx";
import ChatUserListControl from "./ChatUserListControl.jsx";
import ChatViewLink from "../components/ChatViewLink.jsx";
import ChatViewLogBrowser from "./ChatViewLogBrowser.jsx";
import UserLink from "../components/UserLink.jsx";
import { CATEGORY_NAMES, CHANNEL_TYPES, PAGE_TYPES, PAGE_TYPE_NAMES } from "../constants";
import { storeViewState } from "../lib/io";
import { getChannelUri } from "../lib/channelNames";
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
				<ChatViewLink
					type={pageType}
					query={pageQuery}>
					Live
				</ChatViewLink>
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
			let conversationUri = getChannelUri(
				serverName, pageQuery, CHANNEL_TYPES.PRIVATE
			);
			conversationLink = (
				<li key="conversationlink">
					<ChatViewLink
						type={PAGE_TYPES.CHANNEL}
						query={conversationUri}>
						Conversation
					</ChatViewLink>
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
		let {
			logBrowserOpen,
			logDate,
			logDetails,
			pageQuery,
			pageType
		} = this.props;

		if (logBrowserOpen || logDate) {
			return <ChatViewLogBrowser
				logDate={logDate}
				logDetails={logDetails}
				pageQuery={pageQuery}
				pageType={pageType}
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
	logBrowserOpen: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	logUrl: PropTypes.func,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired,
	serverName: PropTypes.string
};

export default ChatViewHeader;
