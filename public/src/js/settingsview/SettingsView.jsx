import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router";

import SettingsFriendsView from "./SettingsFriendsView.jsx";
import SettingsGeneralView from "./SettingsGeneralView.jsx";
import SettingsIrcView from "./SettingsIrcView.jsx";
import SettingsNicknamesView from "./SettingsNicknamesView.jsx";
import { settingsUrl } from "../lib/routeHelpers";

class SettingsView extends PureComponent {

	componentDidMount() {
		// Unlike all other main views, this view starts at the top
		window.scrollTo(0, 0);
	}

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
			case "nicknames":
				page = <SettingsNicknamesView />;
				break;
			default:
				page = <SettingsGeneralView />;
		}

		const className = "mainview settingsview settingsview--" + pageName;

		return (
			<div className={className}>
				<div className="mainview__top settingsview__top">
					<div className="mainview__top__main settingsview__top__main">
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
							<li key="nicknames">
								<Link className="nicknames" to={settingsUrl("nicknames")}>
									Nicknames
								</Link>
							</li>
						</ul>
					</div>
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
