import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";
import without from "lodash/without";

import TimedUserItem from "./TimedUserItem.jsx";

const USER_SYMBOL_ORDER = ["~", "&", "@", "%", "+"];

class ChannelUserList extends PureComponent {

	groupUserList (userList) {
		var output = {};

		forOwn(userList, (symbol, userName) => {
			if (!output[symbol]) {
				output[symbol] = [];
			}

			output[symbol].push(userName);
		});

		forOwn(output, (list) => {
			list.sort();
		});

		return output;
	}

	sortedUserList (userList) {
		var output = [];
		const grouped = this.groupUserList(userList);
		const groups = Object.keys(grouped);

		if (!grouped || !groups || !groups.length) {
			return output;
		}

		// Default promoted symbols in order
		const addUsersOfSymbol = (symbol) => {
			if (grouped[symbol]) {
				output = output.concat(
					grouped[symbol].map((userName) => {
						return { userName, symbol };
					})
				);
			}
		};
		USER_SYMBOL_ORDER.forEach(addUsersOfSymbol);

		// Unrecognized symbols
		const unrecognizedGroups = without(groups, ...USER_SYMBOL_ORDER.concat([""]));
		if (unrecognizedGroups && unrecognizedGroups.length) {
			unrecognizedGroups.forEach(addUsersOfSymbol);
		}

		// The rest; people without symbol
		addUsersOfSymbol("");

		return output;
	}

	render() {
		const { channel, channelUserLists, lastSeenUsers } = this.props;

		var userList = channelUserLists[channel], userListNodes = null;

		if (userList) {
			const sortedList = this.sortedUserList(userList);
			userListNodes = sortedList.map((data) => {
				if (data) {
					const { userName, symbol } = data;
					const userData = lastSeenUsers[userName];
					return <TimedUserItem
						userData={userData}
						userName={userName}
						symbol={symbol}
						key={userName} />;
				}
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
