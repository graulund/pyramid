import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import { RELATIONSHIP_FRIEND, RELATIONSHIP_BEST_FRIEND } from "../constants";

class ChannelUserList extends PureComponent {
	render() {
		const { channel, channelUserLists, friendsList, onClick } = this.props;

		var userList = channelUserLists[channel], numUsers = 0, numFriends = 0;

		if (userList) {
			const userNames = Object.keys(userList);
			if (userNames && userNames.length) {
				numUsers = userNames.length;

				if (friendsList && friendsList[RELATIONSHIP_FRIEND]) {
					var allFriends = friendsList[RELATIONSHIP_FRIEND];
					if (friendsList[RELATIONSHIP_BEST_FRIEND]) {
						allFriends = allFriends.concat(
							friendsList[RELATIONSHIP_BEST_FRIEND]
						);
					}

					userNames.forEach((userName) => {
						if (allFriends.indexOf(userName.toLowerCase()) >= 0) {
							numFriends++;
						}
					});
				}
			}
		}

		if (!numUsers) {
			return null;
		}

		const usersEl = numUsers + " user" + (numUsers === 1 ? "" : "s");

		var friendsEl = null;

		if (numFriends > 0) {
			friendsEl = (
				<em>{ " (" +
					numFriends + " friend" +
					(numFriends === 1 ? "" : "s") +
					")"
				}</em>
			);
		}

		return (
			<a onClick={onClick} href="javascript://">
				{ usersEl }
				{ friendsEl }
			</a>
		);
	}
}

ChannelUserList.propTypes = {
	channelUserLists: PropTypes.object,
	channel: PropTypes.string,
	friendsList: PropTypes.object,
	onClick: PropTypes.func
};

export default connect(({
	channelUserLists,
	friendsList
}) => ({
	channelUserLists,
	friendsList
}))(ChannelUserList);
