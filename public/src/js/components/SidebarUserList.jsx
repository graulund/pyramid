import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import forOwn from "lodash/forOwn";

import UserLink from "./UserLink.jsx";
import UserList from "./UserList.jsx";
import { pluralize, timeColors } from "../lib/formatting";

class SidebarUserList extends PureComponent {

	renderConvoItem(convo, key) {
		let { count, username, userDisplayName } = convo;
		let convoItemStyles = timeColors(0);

		return (
			<div className="extralistitem" style={convoItemStyles} key={username}>
				<div className="l">
					<Link to={`/conversation/${key}`} className="wide">
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
					</Link>
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
