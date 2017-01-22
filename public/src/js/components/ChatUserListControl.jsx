import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

class ChannelUserList extends PureComponent {
	render() {
		const { channel, channelUserLists, onClick } = this.props;

		var userList = channelUserLists[channel], numUsers = 0;

		if (userList) {
			const userNames = Object.keys(userList);
			if (userNames && userNames.length) {
				numUsers = userNames.length;
			}
		}

		return (
			<a onClick={onClick} href="javascript://">
				{ numUsers + " user" + (numUsers === 1 ? "" : "s") }
			</a>
		);
	}
}

ChannelUserList.propTypes = {
	channelUserLists: PropTypes.object,
	channel: PropTypes.string,
	onClick: PropTypes.func
};

export default connect(({ channelUserLists }) => ({
	channelUserLists
}))(ChannelUserList);
