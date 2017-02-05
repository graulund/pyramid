import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import { Link } from "react-router";

import ChannelList from "./ChannelList.jsx";
import HighlightsLink from "./HighlightsLink.jsx";
import UserList from "./UserList.jsx";
import { internalUrl } from "../lib/routeHelpers";
import { CATEGORY_NAMES } from "../constants";
import store from "../store";
import actions from "../actions";

class Sidebar extends PureComponent {
	constructor(props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.setSort = this.setSort.bind(this);
		this.setTab = this.setTab.bind(this);

		this.state = {
			hidden: false,
			sort: "alpha",
			tab: "user"
		};
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
				this.setHidden(true);
			}
		}
	}

	setHidden(hidden) {
		store.dispatch(actions.viewState.update({ sidebarVisible: !hidden }));
	}

	setSort(sort) {
		this.setState({ sort });
	}

	setTab(tab) {
		this.setState({ tab });
	}

	render() {
		const { viewState } = this.props;
		const { sort, tab } = this.state;

		const sidebarVisible = viewState ? viewState.sidebarVisible : true;
		const hidden = !sidebarVisible;

		const className = "sidebar" +
			" sidebar--" + tab +
			" sidebar--" + sort +
			(hidden ? " sidebar--hidden" : "");

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
					<a className="sidebar__close" href="javascript://" onClick={() => this.setHidden(true)}>
						<img src="/img/close.svg" width="16" height="16" alt="Close" />
					</a>
					<ul className="controls sidebar__controls">
						<li><a href="javascript://">Settings</a></li>
						<li><a href={internalUrl("/logout")}>Log out</a></li>
					</ul>
				</div>
				<ul className="sidebar__menu" key="menu">
					<li key="highlights">
						<HighlightsLink />
					</li>
					<li key="allfriends">
						<Link to="/allfriends" className="sidebar__menu-link">
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

export default connect(({ viewState }) => ({ viewState }))(Sidebar);
