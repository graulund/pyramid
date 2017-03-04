import React, { PureComponent, PropTypes } from "react";
import { Link } from "react-router";

import SettingsFriendsView from "./SettingsFriendsView.jsx";
import SettingsGeneralView from "./SettingsGeneralView.jsx";
import SettingsIrcView from "./SettingsIrcView.jsx";
import { settingsUrl } from "../lib/routeHelpers";

class SettingsView extends PureComponent {

	render() {
		const { params } = this.props;
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
			default:
				page = <SettingsGeneralView />;
		}

		const className = "mainview settingsview settingsview--" + pageName;

		return (
			<div className={className}>
				<div className="mainview__top settingsview__top">
					<h2>Settings</h2>
					<ul className="settingsview__tabs switcher" key="tabs">
						<li key="general">
							<Link className="general" to={settingsUrl()}>
								General
							</Link>
						</li>
						<li key="friends">
							<Link className="friends" to={settingsUrl("friends")}>
								Friends
							</Link>
						</li>
						<li key="irc">
							<Link className="irc" to={settingsUrl("irc")}>
								IRC
							</Link>
						</li>
					</ul>
				</div>
				{ page }
			</div>
		);
	}
}

SettingsView.propTypes = {
	params: PropTypes.object
};

export default SettingsView;
