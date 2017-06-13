import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { getTwitchUserDisplayNameData } from "../lib/displayNames";
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
		let displayNameData = getTwitchUserDisplayNameData(
			username, displayName, enableTwitchUserDisplayNames
		);

		let { primary, secondary, tooltip } = displayNameData;

		if (secondary) {
			content = [
				primary + " ",
				<em key="secondary">({ secondary })</em>
			];
		}
		else {
			content = primary;
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
				title={tooltip}
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
