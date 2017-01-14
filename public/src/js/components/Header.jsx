import React, { Component } from "react";

import store from "../store";
import actions from "../actions";

class Header extends Component {
	constructor(props) {
		super(props);
		this.openSidebar = this.openSidebar.bind(this);
	}

	openSidebar() {
		store.dispatch(actions.viewState.update({ sidebarVisible: true }));
	}

	render() {
		return (
			<div id="header">
				<a className="sidebar__open" href="javascript://" onClick={this.openSidebar}>
					<img src="/img/menu.svg" width="16" height="16" alt="Sidebar" />
				</a>
			</div>
		);
	}
}

export default Header;
