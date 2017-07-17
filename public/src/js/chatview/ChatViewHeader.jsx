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
import * as multiChat from "../lib/multiChat";
import { refElSetter } from "../lib/refEls";
import store from "../store";
import actions from "../actions";

class ChatViewHeader extends PureComponent {
	constructor(props) {
		super(props);

		this.closeLogBrowser = this.closeLogBrowser.bind(this);
		this.openLogBrowser = this.openLogBrowser.bind(this);
		this.closeWindowMenu = this.closeWindowMenu.bind(this);
		this.toggleWindowMenu = this.toggleWindowMenu.bind(this);
		this.addFrameToTheLeft = this.addFrameToTheLeft.bind(this);
		this.addFrameToTheRight = this.addFrameToTheRight.bind(this);
		this.addFrameAbove = this.addFrameAbove.bind(this);
		this.addFrameBelow = this.addFrameBelow.bind(this);
		this.removeFrame = this.removeFrame.bind(this);

		this.els = {};
		this.setWindowCtrl = refElSetter("windowCtrl").bind(this);

		this.state = {
			windowMenuOpen: false
		};
	}

	componentDidMount() {
		let { windowCtrl } = this.els;

		// Close the menu on outside and inside click
		this.closeClickHandler = (evt) => {
			if (
				evt.target === windowCtrl ||
				evt.target.parentNode === windowCtrl
			) {
				return;
			}

			this.closeWindowMenu();
		};
		document.addEventListener("click", this.closeClickHandler);
	}

	componentWillUnmount() {
		// Remove external close handler
		if (this.closeClickHandler) {
			document.removeEventListener("click", this.closeClickHandler);
		}
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

	closeWindowMenu() {
		this.setState({ windowMenuOpen: false });
	}

	toggleWindowMenu() {
		const { windowMenuOpen } = this.state;
		this.setState({ windowMenuOpen: !windowMenuOpen });
	}

	addFrameToTheLeft() {
		let { index } = this.props;
		multiChat.addFrameToTheLeft(index);
	}

	addFrameToTheRight() {
		let { index } = this.props;
		multiChat.addFrameToTheRight(index);
	}

	addFrameAbove() {
		let { index } = this.props;
		multiChat.addFrameAbove(index);
	}

	addFrameBelow() {
		let { index } = this.props;
		multiChat.addFrameBelow(index);
	}

	removeFrame() {
		let { index } = this.props;
		multiChat.removeFrame(index);
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

		const {
			windowMenuOpen
		} = this.state;

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

		let windowCtrlClassName = "menu-opener" +
			(windowMenuOpen ? " menu-opener--active" : "");

		return (
			<ul className="controls chatview__controls">
				{ firstButton }
				<li key="logbrowser">
					{ logBrowserToggler }
				</li>
				<li className={windowCtrlClassName} key="windowctrl">
					<a
						href="javascript://"
						ref={this.setWindowCtrl}
						onClick={this.toggleWindowMenu}
						title="Open window controls">
						<img
							src="/img/diamond.svg"
							width="16"
							height="16"
							alt="Window control" />
					</a>
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

	renderWindowMenu() {
		let { totalViews } = this.props;
		let { windowMenuOpen } = this.state;
		let windowMenuStyles = windowMenuOpen ? { display: "block" } : null;

		return (
			<ul
				className="menu pop-menu chatview__window-menu"
				key="window-menu"
				style={windowMenuStyles}>
				{ totalViews > 1 ? (
					<li key="close">
						<a
							className="menu__link"
							href="javascript://"
							onClick={this.removeFrame}>
							Close frame
						</a>
					</li>
				) : null }
				<li key="left" className={totalViews > 1 && "sep"}>
					<a
						className="menu__link"
						href="javascript://"
						onClick={this.addFrameToTheLeft}>
						New frame to the left
					</a>
				</li>
				<li key="right">
					<a
						className="menu__link"
						href="javascript://"
						onClick={this.addFrameToTheRight}>
						New frame to the right
					</a>
				</li>
				<li key="up">
					<a
						className="menu__link"
						href="javascript://"
						onClick={this.addFrameAbove}>
						New frame above
					</a>
				</li>
				<li key="down">
					<a
						className="menu__link"
						href="javascript://"
						onClick={this.addFrameBelow}>
						New frame below
					</a>
				</li>
			</ul>
		);
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
		const windowMenu = this.renderWindowMenu();

		return (
			<div className="mainview__top chatview__top" key="top">
				<div className="mainview__top__main" key="topMain">
					<h2>{ heading }</h2>
					{ controls }
				</div>
				{ logBrowser }
				{ windowMenu }
			</div>
		);
	}
}

ChatViewHeader.propTypes = {
	displayName: PropTypes.string,
	index: PropTypes.number,
	isLiveChannel: PropTypes.bool,
	logBrowserOpen: PropTypes.bool,
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	logUrl: PropTypes.func,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired,
	serverName: PropTypes.string,
	totalViews: PropTypes.number
};

export default ChatViewHeader;
