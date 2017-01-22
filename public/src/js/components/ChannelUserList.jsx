import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import sortedUniq from "lodash/sortedUniq";

import TimedUserItem from "./TimedUserItem.jsx";

//const SYMBOL_RANK_ORDER = ["~", "&", "@", "%", "+"];

class ChannelUserList extends PureComponent {
	render() {
		const { channel, channelUserLists, lastSeenUsers } = this.props;

		var usernames = channelUserLists[channel], userListNodes = null;

		if (usernames && usernames.length) {
			usernames.sort();
			usernames = sortedUniq(usernames); // TODO: Investigate source of duplicate entries
			userListNodes = usernames.map((userName) => {
				const userData = lastSeenUsers[userName];
				return <TimedUserItem userData={userData} userName={userName} key={userName} />;
			});
		}

		return (
			<ul className="channeluserlist itemlist">{ userListNodes }</ul>
		);
	}
}

ChannelUserList.propTypes = {
	channelUserLists: PropTypes.object,
	channel: PropTypes.string,
	lastSeenUsers: PropTypes.object
};

export default connect(({
	channelUserLists,
	lastSeenUsers
}) => ({
	channelUserLists,
	lastSeenUsers
}))(ChannelUserList);
