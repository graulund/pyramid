import React, { Component, PropTypes } from "react";

import ChannelList from "./ChannelList.jsx";
import UserList from "./UserList.jsx";

class Sidebar extends Component {
	constructor(props) {
		super(props);

		this.setSort = this.setSort.bind(this);
		this.setTab = this.setTab.bind(this);

		this.state = {
			sort: "alpha",
			tab: "user"
		};
	}

	setSort(sort) {
		this.setState({ sort });
	}

	setTab(tab) {
		//store.dispatch(actions.viewState.update({ sidebarTab }));
		this.setState({ tab });
	}

	render() {
		const { viewState } = this.props;
		const { sort, tab } = this.state;

		const className = "sidebar" +
			" sidebar--" + tab +
			" sidebar--" + sort;

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
				</div>
				<UserList sort={sort} key="userlist" />
				<ChannelList sort={sort} key="channellist" />
			</div>
		);
	}
}

/* <p>Sort by:</p> */

export default Sidebar;
