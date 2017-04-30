import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import SettingsFriendsView from "./SettingsFriendsView.jsx";
import SettingsGeneralView from "./SettingsGeneralView.jsx";
import SettingsIrcView from "./SettingsIrcView.jsx";
import SettingsNicknamesView from "./SettingsNicknamesView.jsx";
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
			default:
				page = <SettingsGeneralView />;
		}

		const className = "mainview settingsview settingsview--" + pageName;

		const items = Object.keys(SETTINGS_PAGE_NAMES);

		return (
			<div className={className}>
				<div className="mainview__top settingsview__top">
					<div className="mainview__top__main settingsview__top__main">
						<h2>Settings</h2>
						<ul className="settingsview__tabs switcher" key="tabs">
							{ items.map((item) => (
								<li key={item}>
									<Link className={item} to={settingsUrl(item)}>
										{ SETTINGS_PAGE_NAMES[item] }
									</Link>
								</li>
							)) }
						</ul>
					</div>
				</div>
				{ page }
			</div>
		);
	}
}

SettingsView.propTypes = {
	match: PropTypes.object
};

export default SettingsView;
