import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import ChannelList from "./ChannelList.jsx";
import ChatViewLink from "./ChatViewLink.jsx";
import HighlightsLink from "./HighlightsLink.jsx";
import SidebarUserList from "./SidebarUserList.jsx";
import VersionNumber from "./VersionNumber.jsx";
import actions from "../actions";
import { CATEGORY_NAMES, PAGE_TYPES } from "../constants";
import store from "../store";
import { pluralize } from "../lib/formatting";
import { storeViewState } from "../lib/io";
import { refElSetter } from "../lib/refEls";
import { internalUrl, settingsUrl } from "../lib/routeHelpers";
import { isMobile } from "../lib/visualBehavior";

class Sidebar extends PureComponent {
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.hide = this.hide.bind(this);
		this.showUsers = this.showUsers.bind(this);
		this.showChannels = this.showChannels.bind(this);
		this.sortByAlpha = this.sortByAlpha.bind(this);
		this.sortByActivity = this.sortByActivity.bind(this);
		this.toggleSystemMenu = this.toggleSystemMenu.bind(this);

		this.els = {};
		this.setCog = refElSetter("cog").bind(this);

		this.state = {
			systemMenuOpen: false
		};
	}

	componentDidMount() {
		let { cog } = this.els;

		// Close the menu on outside and inside click
		this.closeClickHandler = (evt) => {
			if (evt.target === cog || evt.target.parentNode === cog) {
				return;
			}

			this.closeSystemMenu();
		};
		document.addEventListener("click", this.closeClickHandler);
	}

	componentWillUnmount() {
		// Remove external close handler
		if (this.closeClickHandler) {
			document.removeEventListener("click", this.closeClickHandler);
		}
	}

	// Event handler

	onClick(evt) {
		let { cog } = this.els;

		if (isMobile() && evt && evt.nativeEvent) {
			let target = evt.nativeEvent.target;

			if (
				target &&
				target !== cog && (
					target.tagName === "A" ||
					target.className === "channelname" ||
					(
						target.parentNode &&
						target.parentNode !== cog && (
							target.parentNode.tagName === "A" ||
							target.parentNode.className === "channelname"
						)
					)
				)
			) {
				this.hide();
			}
		}
	}

	// Generic state methods

	setSort(sort) {
		const change = { sidebarSort: sort };
		store.dispatch(actions.viewState.update(change));
		storeViewState(change);
	}

	setTab(tab) {
		const change = { sidebarTab: tab };
		store.dispatch(actions.viewState.update(change));
		storeViewState(change);
	}

	setVisible(visible) {
		store.dispatch(actions.viewState.update({ sidebarVisible: visible }));

		// This is not stored remotely, as it follows special behavior once loaded,
		// depending on which page you're on, and your viewport
	}

	// Bound state methods

	hide() {
		this.setVisible(false);
	}

	showUsers() {
		this.setTab("user");
	}

	showChannels() {
		this.setTab("channel");
	}

	sortByAlpha() {
		this.setSort("alpha");
	}

	sortByActivity() {
		this.setSort("activity");
	}

	closeSystemMenu() {
		this.setState({ systemMenuOpen: false });
	}

	toggleSystemMenu() {
		const { systemMenuOpen } = this.state;
		this.setState({ systemMenuOpen: !systemMenuOpen });
	}

	getUnseenConversationsCount() {
		let { unseenConversations } = this.props;

		return Object.keys(unseenConversations).length;
	}

	render() {
		const {
			sidebarSort: sort = "alpha",
			sidebarTab: tab = "user",
			sidebarVisible: visible = true,
			unseenConversations
		} = this.props;
		const { systemMenuOpen } = this.state;

		const className = "sidebar" +
			" scroller scroller--thin" +
			" sidebar--" + tab +
			" sidebar--" + sort +
			(!visible ? " sidebar--hidden" : "");

		const outerClassName = "sidebar__outer" +
			(!visible ? " sidebar__outer--hidden" : "");

		var content = null;

		if (tab === "user") {
			content = (
				<SidebarUserList
					sort={sort}
					unseenConversations={unseenConversations}
					visible={visible}
					key="userlist" />
			);
		}
		else if (tab === "channel") {
			content = (
				<ChannelList
					sort={sort}
					visible={visible}
					key="channellist" />
			);
		}

		const cogClassName = "menu-opener" +
			(systemMenuOpen ? " menu-opener--active" : "");
		const systemMenuStyles = systemMenuOpen ? { display: "block" } : null;

		const systemMenu = (
			<ul
				className="menu pop-menu sidebar__system-menu"
				key="system-menu"
				style={systemMenuStyles}
				onClick={this.onClick}>
				<li key="settings">
					<Link to={settingsUrl()} className="menu__link">
						Settings
					</Link>
				</li>
				<li key="log">
					<ChatViewLink
						type={PAGE_TYPES.CATEGORY}
						query="system"
						className="menu__link">
						{ CATEGORY_NAMES.system }
					</ChatViewLink>
				</li>
				<li key="logout" className="sep">
					<a href={internalUrl("/logout")} className="menu__link">
						Log out
					</a>
				</li>
			</ul>
		);

		const unseenConversationsCount = this.getUnseenConversationsCount();

		const unseenBadge = unseenConversationsCount && tab !== "user"
			? (
				<strong
					className="badge"
					title={
						unseenConversationsCount +
						pluralize(
							unseenConversationsCount,
							" unseen conversation", "s"
						)
				}>
					{ unseenConversationsCount }
				</strong>
			)
			: null;

		const sidebar = (
			<div id="sidebar"
				className={className}
				key="main"
				onClick={this.onClick}>
				<div className="sidebar__head" key="head">
					<h1>Pyramid <VersionNumber /></h1>
					<a className="sidebar__close" href="javascript://" onClick={this.hide}>
						<img src="/img/close.svg" width="16" height="16" alt="Close" />
					</a>
					<a className={cogClassName}
						href="javascript://"
						ref={this.setCog}
						onClick={this.toggleSystemMenu}
						title="Open system menu">
						<img src="/img/cog.svg" width="16" height="16" alt="System" />
					</a>

				</div>
				<ul className="menu sidebar__menu" key="menu">
					<li key="highlights">
						<HighlightsLink className="menu__link" />
					</li>
					<li key="allfriends">
						<ChatViewLink
							type={PAGE_TYPES.CATEGORY}
							query="allfriends"
							className="menu__link">
							{ CATEGORY_NAMES.allfriends }
						</ChatViewLink>
					</li>
				</ul>
				<div className="sidebar__list" key="list">
					<div className="sidebar__list-head">
						<ul className="sidebar__tabs switcher" key="tabs">
							<li key="user">
								<button className="user"
									onClick={this.showUsers}>
									Friends
									{ unseenBadge }
								</button>
							</li>
							<li key="channel">
								<button className="channel"
									onClick={this.showChannels}>
									Channels
								</button>
							</li>
						</ul>
						<div className="sidebar__sort" key="sort">
							<ul className="switcher" key="sortswitcher">
								<li key="alpha">
									<button className="alpha"
										onClick={this.sortByAlpha}>
										Alphabetical
									</button>
								</li>
								<li key="activity">
									<button className="activity"
										onClick={this.sortByActivity}>
										Activity
									</button>
								</li>
							</ul>
						</div>
					</div>
					{ content }
				</div>
			</div>
		);

		return (
			<div className={outerClassName}>
				{ sidebar }
				{ systemMenu }
			</div>
		);
	}
}

Sidebar.propTypes = {
	sidebarSort: PropTypes.string,
	sidebarTab: PropTypes.string,
	sidebarVisible: PropTypes.bool,
	unseenConversations: PropTypes.object
};

export default connect(({
	unseenConversations,
	viewState: {
		sidebarSort,
		sidebarTab,
		sidebarVisible
	}
}) => ({
	sidebarSort,
	sidebarTab,
	sidebarVisible,
	unseenConversations
}))(Sidebar);
