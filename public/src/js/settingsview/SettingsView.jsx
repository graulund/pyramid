import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

import SettingsFriendsView from "./SettingsFriendsView.jsx";
import SettingsGeneralView from "./SettingsGeneralView.jsx";
import SettingsIrcView from "./SettingsIrcView.jsx";
import SettingsNicknamesView from "./SettingsNicknamesView.jsx";
import SettingsTwitchView from "./SettingsTwitchView.jsx";
import { SETTINGS_PAGE_NAMES } from "../constants";
import { settingsUrl } from "../lib/routeHelpers";

class SettingsView extends PureComponent {

	componentDidMount() {
		// Unlike all other main views, this view starts at the top
		window.scrollTo(0, 0);
	}

	render() {
		const { match: { params } } = this.props;
		var { pageName } = params;

		if (!pageName) {
			pageName = "general";
		}

		var page;
		switch (pageName) {
			case "friends":
				page = <SettingsFriendsView />;
				break;
			case "irc":
				page = <SettingsIrcView />;
				break;
			case "nicknames":
				page = <SettingsNicknamesView />;
				break;
			case "twitch":
				page = <SettingsTwitchView />;
				break;
			default:
				page = <SettingsGeneralView />;
		}

		const items = Object.keys(SETTINGS_PAGE_NAMES);

		return (
			<div className="mainview settingsview">
				<div className="mainview__top settingsview__top">
					<div className="mainview__top__main settingsview__top__main">
						<h2>Settings</h2>
						<ul className="settingsview__tabs switcher" key="tabs">
							{ items.map((item) => (
								<li key={item}>
									<NavLink
										exact
										to={settingsUrl(item)}
										activeClassName="selected">
										{ SETTINGS_PAGE_NAMES[item] }
									</NavLink>
								</li>
							)) }
						</ul>
					</div>
				</div>
				<div className="mainview__content">
					<div className="mainview__content__primary mainview__frame-container">
						<div className="mainview__inner-frame scroller">
							{ page }
						</div>
					</div>
				</div>
			</div>
		);
	}
}

SettingsView.propTypes = {
	match: PropTypes.object
};

export default SettingsView;
