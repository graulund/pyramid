import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import { Link } from "react-router";

import ChannelList from "./ChannelList.jsx";
import HighlightsLink from "./HighlightsLink.jsx";
import UserList from "./UserList.jsx";
import { storeViewState } from "../lib/io";
import { categoryUrl, internalUrl, settingsUrl } from "../lib/routeHelpers";
import { CATEGORY_NAMES } from "../constants";
import store from "../store";
import actions from "../actions";

class Sidebar extends PureComponent {
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.setSort = this.setSort.bind(this);
		this.setTab = this.setTab.bind(this);
	}

	onClick(evt) {
		if (evt && evt.nativeEvent) {
			var target = evt.nativeEvent.target;

			if (
				target && (
					target.tagName === "A" ||
					target.className === "channelname" ||
					(
						target.parentNode && (
							target.parentNode.tagName === "A" ||
							target.parentNode.className === "channelname"
						)
					)
				)
			) {
				this.setVisible(false);
			}
		}
	}

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

	render() {
		const { viewState = {} } = this.props;

		const {
			sidebarSort: sort = "alpha",
			sidebarTab: tab = "user",
			sidebarVisible: visible = true
		} = viewState;

		const className = "sidebar" +
			" sidebar--" + tab +
			" sidebar--" + sort +
			(!visible ? " sidebar--hidden" : "");

		var content = null;

		if (tab === "user") {
			content = <UserList sort={sort} key="userlist" />;
		}
		else if (tab === "channel") {
			content = <ChannelList sort={sort} key="channellist" />;
		}

		return (
			<div id="sidebar" className={className} key="main" onClick={this.onClick}>
				<div className="sidebar__head" key="head">
					<h1>Pyramid</h1>
					<a className="sidebar__close" href="javascript://" onClick={() => this.setVisible(false)}>
						<img src="/img/close.svg" width="16" height="16" alt="Close" />
					</a>
					<ul className="controls sidebar__controls">
						<li><Link to={settingsUrl()}>Settings</Link></li>
						<li><a href={internalUrl("/logout")}>Log out</a></li>
					</ul>
				</div>
				<ul className="sidebar__menu" key="menu">
					<li key="highlights">
						<HighlightsLink />
					</li>
					<li key="allfriends">
						<Link to={categoryUrl("allfriends")} className="sidebar__menu-link">
							{ CATEGORY_NAMES.allfriends }
						</Link>
					</li>
				</ul>
				<div className="sidebar__list" key="list">
					<div className="sidebar__list-head">
						<ul className="sidebar__tabs switcher" key="tabs">
							<li key="user">
								<button className="user"
									onClick={() => this.setTab("user")}>
									Friends
								</button>
							</li>
							<li key="channel">
								<button className="channel"
									onClick={() => this.setTab("channel")}>
									Channels
								</button>
							</li>
						</ul>
						<div className="sidebar__sort" key="sort">
							<ul className="switcher" key="sortswitcher">
								<li key="alpha">
									<button className="alpha"
										onClick={() => this.setSort("alpha")}>Alphabetical
									</button>
								</li>
								<li key="activity">
									<button className="activity"
										onClick={() => this.setSort("activity")}>Activity
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
	viewState: PropTypes.object
};

// TODO: Only connect the relevant subproperties of viewState
export default connect(({ viewState }) => ({ viewState }))(Sidebar);
