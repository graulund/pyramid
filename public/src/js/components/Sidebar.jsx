import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";

import ChannelList from "./ChannelList.jsx";
import UserList from "./UserList.jsx";
import store from "../store";
import actions from "../actions";

class Sidebar extends Component {
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

			if (target && (
				target.tagName === "A" || target.className === "channelname"
			)) {
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

		return (
			<div id="sidebar" className={className} key="main" onClick={this.onClick}>
				<div className="sidebar__head">
					<ul className="sidebar__tabs switcher" key="tabs">
						<li key="user">
							<button className="user"
								onClick={() => this.setTab("user")}>Users</button>
						</li>
						<li key="channel">
							<button className="channel"
								onClick={() => this.setTab("channel")}>Channels</button>
						</li>
					</ul>
					<div className="sidebar__sort">
						<ul className="switcher" key="sortswitcher">
							<li key="alpha">
								<button className="alpha"
									onClick={() => this.setSort("alpha")}>Alphabetical</button>
							</li>
							<li key="activity">
								<button className="activity"
									onClick={() => this.setSort("activity")}>Activity</button>
							</li>
						</ul>
					</div>
					<a className="sidebar__close" href="javascript://" onClick={() => this.setHidden(true)}>
						<img src="/img/close.svg" width="16" height="16" alt="Close" />
					</a>
				</div>
				<UserList sort={sort} key="userlist" />
				<ChannelList sort={sort} key="channellist" />
			</div>
		);
	}
}

Sidebar.propTypes = {
	viewState: PropTypes.object
};

export default connect(({ viewState }) => ({ viewState }))(Sidebar);
