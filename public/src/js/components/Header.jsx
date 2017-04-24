import React from "react";

import store from "../store";
import actions from "../actions";

function openSidebar() {
	store.dispatch(actions.viewState.update({ sidebarVisible: true }));
}

const Header = function() {
	return (
		<div id="header">
			<a
				className="sidebar__open"
				href="javascript://"
				onClick={openSidebar}>
				<img src="/img/menu.svg" width="16" height="16" alt="Sidebar" />
			</a>
		</div>
	);
};

export default Header;
