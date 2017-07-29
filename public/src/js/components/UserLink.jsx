import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChatViewLink from "./ChatViewLink.jsx";
import { CHANNEL_TYPES } from "../constants";
import { getChannelUri } from "../lib/channelNames";
import { getMyIrcNick } from "../lib/connectionStatus";
import { getTwitchUserDisplayNameData } from "../lib/displayNames";

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

		var type, query;

		if (!isFriend || noLink) {

			// Link-free output if wanted

			let me = serverName && getMyIrcNick(serverName);

			if (noLink || !serverName || username === me) {
				return <span className={block} key="main">{ content }</span>;
			}

			// Conversation link output for non-friends

			type = "channel";
			query = getChannelUri(serverName, username, CHANNEL_TYPES.PRIVATE);
		}

		else {
			type = "user";
			query = username;
		}

		// User page link output for friends

		return (
			<ChatViewLink
				className={block}
				query={query}
				type={type}
				title={tooltip}
				key="main">
				{ content }
			</ChatViewLink>
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
