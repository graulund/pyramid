import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { findDOMNode } from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import throttle from "lodash/throttle";

import ChannelList from "./ChannelList.jsx";
import HighlightsLink from "./HighlightsLink.jsx";
import UserList from "./UserList.jsx";
import VersionNumber from "./VersionNumber.jsx";
import actions from "../actions";
import { CATEGORY_NAMES } from "../constants";
import store from "../store";
import { storeViewState } from "../lib/io";
import { refElSetter } from "../lib/refEls";
import { categoryUrl, internalUrl, settingsUrl } from "../lib/routeHelpers";
import { isMobile } from "../lib/visualBehavior";

class Sidebar extends PureComponent {
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.hide = this.hide.bind(this);
		this.setListDimensions = this.setListDimensions.bind(this);
		this.showUsers = this.showUsers.bind(this);
		this.showChannels = this.showChannels.bind(this);
		this.sortByAlpha = this.sortByAlpha.bind(this);
		this.sortByActivity = this.sortByActivity.bind(this);
		this.toggleSystemMenu = this.toggleSystemMenu.bind(this);

		this.handleResize = throttle(this.setListDimensions, 16);

		this.els = {};
		this.setCog = refElSetter("cog").bind(this);

		this.state = {
			listHeight: 0,
			listWidth: 0,
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

		window.addEventListener("resize", this.handleResize);
		this.setListDimensions();
	}

	componentWillUnmount() {
		// Remove external close handler
		if (this.closeClickHandler) {
			document.removeEventListener("click", this.closeClickHandler);
		}

		window.removeEventListener("resize", this.handleResize);
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

	setListDimensions() {
		if (!this.root) {
			this.root = findDOMNode(this);
		}

		if (this.root) {
			let r = this.root;
			let topRect = r.querySelector(".sidebar__top").getBoundingClientRect();
			let listHeadRect = r.querySelector(".sidebar__list-head").getBoundingClientRect();
			let listWidth = topRect.width;
			let listHeight = window.innerHeight - topRect.height - listHeadRect.height;

			this.setState({ listHeight, listWidth });
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

	closeSystemMenu() {
		this.setState({ systemMenuOpen: false });
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

	toggleSystemMenu() {
		const { systemMenuOpen } = this.state;
		this.setState({ systemMenuOpen: !systemMenuOpen });
	}

	render() {
		const {
			sidebarSort: sort = "alpha",
			sidebarTab: tab = "user",
			sidebarVisible: visible = true
		} = this.props;
		const { listHeight, listWidth, systemMenuOpen } = this.state;

		const className = "sidebar" +
			" sidebar--" + tab +
			" sidebar--" + sort +
			(!visible ? " sidebar--hidden" : "");

		var content = null;

		if (tab === "user") {
			content = (
				<UserList
					height={listHeight}
					sort={sort}
					visible={visible}
					width={listWidth}
					key="userlist" />
			);
		}
		else if (tab === "channel") {
			content = (
				<ChannelList
					height={listHeight}
					sort={sort}
					visible={visible}
					width={listWidth}
					key="channellist" />
			);
		}

		const systemMenuStyles = systemMenuOpen ? { display: "block" } : null;

		return (
			<div id="sidebar" className={className} key="main" onClick={this.onClick}>
				<div className="sidebar__top" key="top">
					<div className="sidebar__head" key="head">
						<h1>Pyramid <VersionNumber /></h1>
						<a className="sidebar__close" href="javascript://" onClick={this.hide}>
							<img src="/img/close.svg" width="16" height="16" alt="Close" />
						</a>
						<a className="sidebar__cog"
							href="javascript://"
							ref={this.setCog}
							onClick={this.toggleSystemMenu}>
							<img src="/img/cog.svg" width="16" height="16" alt="System" />
						</a>
						<ul className="sidebar__system-menu" style={systemMenuStyles}>
							<li key="settings">
								<Link to={settingsUrl()} className="sidebar__menu-link">
									Settings
								</Link>
							</li>
							<li key="log">
								<Link to={categoryUrl("system")} className="sidebar__menu-link">
									System log
								</Link>
							</li>
							<li key="logout" className="sep">
								<a href={internalUrl("/logout")} className="sidebar__menu-link">
									Log out
								</a>
							</li>
						</ul>
					</div>
					<ul className="sidebar__menu" key="menu">
						<li key="highlights">
							<HighlightsLink className="sidebar__menu-link" />
						</li>
						<li key="allfriends">
							<Link to={categoryUrl("allfriends")} className="sidebar__menu-link">
								{ CATEGORY_NAMES.allfriends }
							</Link>
						</li>
					</ul>
				</div>
				<div className="sidebar__list" key="list">
					<div className="sidebar__list-head">
						<ul className="sidebar__tabs switcher" key="tabs">
							<li key="user">
								<button className="user"
									onClick={this.showUsers}>
									Friends
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
	}
}

Sidebar.propTypes = {
	sidebarSort: PropTypes.string,
	sidebarTab: PropTypes.string,
	sidebarVisible: PropTypes.bool
};

export default connect(({
	viewState: {
		sidebarSort,
		sidebarTab,
		sidebarVisible
	}
}) => ({
	sidebarSort,
	sidebarTab,
	sidebarVisible
}))(Sidebar);
