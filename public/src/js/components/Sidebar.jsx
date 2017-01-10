import React, { Component, PropTypes } from "react";

import ChannelList from "./ChannelList.jsx";
import UserList from "./UserList.jsx";

class Sidebar extends Component {
	constructor(props) {
		super(props);

		this.setSort = this.setSort.bind(this);
		this.setTab = this.setTab.bind(this);

		this.state = {
			hidden: false,
			sort: "alpha",
			tab: "user"
		};
	}

	setHidden(hidden) {
		this.setState({ hidden });
	}

	setSort(sort) {
		this.setState({ sort });
	}

	setTab(tab) {
		this.setState({ tab });
	}

	render() {
		const { viewState } = this.props;
		const { hidden, sort, tab } = this.state;

		const className = "sidebar" +
			" sidebar--" + tab +
			" sidebar--" + sort +
			(hidden ? " sidebar--hidden" : "");

		return (
			<div id="sidebar" className={className} key="main">
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
				<a className="sidebar__open" href="javascript://" onClick={() => this.setHidden(false)}>
					Sidebar
				</a>
			</div>
		);
	}
}

/* <p>Sort by:</p> */

export default Sidebar;
