import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { TWITCH_DISPLAY_NAMES } from "../constants";
import { userUrl } from "../lib/routeHelpers";

class UserLink extends PureComponent {
	render() {
		const {
			className,
			displayName,
			enableTwitchUserDisplayNames,
			friendsList,
			noLink,
			username
		} = this.props;

		if (!username) {
			return null;
		}

		var content = username;

		// If displaying display name

		if (enableTwitchUserDisplayNames && displayName && displayName !== username) {
			if (displayName.toLowerCase() !== username.toLowerCase()) {
				// Totally different altogether
				if (enableTwitchUserDisplayNames === TWITCH_DISPLAY_NAMES.ALL) {
					content = [
						displayName + " ",
						<em key="origName">({ username })</em>
					];
				}
			}
			else {
				// Merely case changes
				content = displayName;
			}
		}

		// Does this user exist in the friends list?

		var isFriend = false;

		for (var list in friendsList) {
			if (friendsList.hasOwnProperty(list)) {
				if (friendsList[list].indexOf(username) >= 0) {
					isFriend = true;
					break;
				}
			}
		}

		// Link-free output for non-friends

		if (!isFriend || noLink) {
			return <span className={className} key="main">{ content }</span>;
		}

		// Link output for friends

		return (
			<Link
				className={className}
				to={userUrl(username)}
				key="main">
				{ content }
			</Link>
		);
	}
}

UserLink.propTypes = {
	className: PropTypes.string,
	displayName: PropTypes.string,
	enableTwitchUserDisplayNames: PropTypes.number,
	friendsList: PropTypes.object,
	noLink: PropTypes.bool,
	username: PropTypes.string.isRequired
};

export default connect(({
	appConfig: { enableTwitchUserDisplayNames },
	friendsList
}) => ({
	enableTwitchUserDisplayNames,
	friendsList
}))(UserLink);
