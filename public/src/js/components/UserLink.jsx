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
			enableTwitchDisplayNames,
			friendsList,
			noLink,
			userName
		} = this.props;

		if (!userName) {
			return null;
		}

		var content = userName;

		// If displaying display name

		if (enableTwitchDisplayNames && displayName && displayName !== userName) {
			if (displayName.toLowerCase() !== userName.toLowerCase()) {
				// Totally different altogether
				if (enableTwitchDisplayNames === TWITCH_DISPLAY_NAMES.ALL) {
					content = [
						displayName + " ",
						<em key="origName">({ userName })</em>
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
				if (friendsList[list].indexOf(userName) >= 0) {
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
				to={userUrl(userName)}
				key="main">
				{ content }
			</Link>
		);
	}
}

UserLink.propTypes = {
	className: PropTypes.string,
	displayName: PropTypes.string,
	enableTwitchDisplayNames: PropTypes.number,
	friendsList: PropTypes.object,
	noLink: PropTypes.bool,
	userName: PropTypes.string.isRequired
};

export default connect(({
	appConfig: { enableTwitchDisplayNames },
	friendsList
}) => ({
	enableTwitchDisplayNames,
	friendsList
}))(UserLink);
