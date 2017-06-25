import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { getTwitchUserDisplayNameData } from "../lib/displayNames";
import { conversationUrl, userUrl } from "../lib/routeHelpers";

const block = "userlink";

class UserLink extends PureComponent {
	render() {
		const {
			displayName,
			enableTwitchUserDisplayNames,
			friendsList,
			noLink,
			serverName,
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

		if (!isFriend || noLink) {

			// Link-free output if wanted

			let nonLink = <span className={block} key="main">{ content }</span>;

			if (noLink) {
				return nonLink;
			}

			// Conversation link output for non-friends

			else {
				if (serverName) {
					return (
						<Link
							className={block}
							to={conversationUrl(serverName, username)}
							title={tooltip}
							key="main">
							{ content }
						</Link>
					);
				}

				else {
					return nonLink;
				}
			}
		}

		// User page link output for friends

		return (
			<Link
				className={block}
				to={userUrl(username)}
				title={tooltip}
				key="main">
				{ content }
			</Link>
		);
	}
}

UserLink.propTypes = {
	displayName: PropTypes.string,
	enableTwitchUserDisplayNames: PropTypes.number,
	friendsList: PropTypes.object,
	noLink: PropTypes.bool,
	serverName: PropTypes.string,
	username: PropTypes.string.isRequired
};

export default connect(({
	appConfig: { enableTwitchUserDisplayNames },
	friendsList
}) => ({
	enableTwitchUserDisplayNames,
	friendsList
}))(UserLink);
