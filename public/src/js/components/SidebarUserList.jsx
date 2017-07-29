import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";

import ChatViewLink from "./ChatViewLink.jsx";
import UserLink from "./UserLink.jsx";
import UserList from "./UserList.jsx";
import { CHANNEL_TYPES, PAGE_TYPES } from "../constants";
import { getChannelUri } from "../lib/channelNames";
import { pluralize, timeColors } from "../lib/formatting";

class SidebarUserList extends PureComponent {

	renderConvoItem(convo) {
		let { count, serverName, username, userDisplayName } = convo;
		let convoItemStyles = timeColors(0);
		let conversationUri = getChannelUri(serverName, username, CHANNEL_TYPES.PRIVATE);

		return (
			<div className="extralistitem" style={convoItemStyles} key={username}>
				<div className="l">
					<ChatViewLink
						type={PAGE_TYPES.CHANNEL}
						query={conversationUri}
						className="wide">
						<strong>
							<UserLink
								noLink
								username={username}
								displayName={userDisplayName}
								key={username} />
						</strong>
						{" "}
						<em className="badge">{ count }</em>
						<span className="now">
							{" " + pluralize(count, "unread message", "s")}
						</span>
					</ChatViewLink>
				</div>
			</div>
		);
	}

	render() {
		const {
			sort = "alpha",
			unseenConversations,
			visible = true
		} = this.props;

		let ignoreUsernames = [], unseenConvoEls = [];

		forOwn(unseenConversations, (convo, key) => {
			if (convo) {
				let { username } = convo;
				unseenConvoEls.push(this.renderConvoItem(convo, key));
				ignoreUsernames.push(username);
			}
		});

		return (
			<div>
				{ unseenConvoEls }
				<UserList
					ignoreUsernames={ignoreUsernames}
					sort={sort}
					visible={visible}
					key="userlist" />
			</div>
		);
	}
}

SidebarUserList.propTypes = {
	enableDarkMode: PropTypes.bool,
	sort: PropTypes.string,
	unseenConversations: PropTypes.object,
	visible: PropTypes.bool
};

export default connect(({
	appConfig: { enableDarkMode }
}) => ({
	enableDarkMode
}))(SidebarUserList);
