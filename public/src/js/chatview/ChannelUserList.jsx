import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";
import without from "lodash/without";

import TimedUserItem from "../components/TimedUserItem.jsx";

const USER_SYMBOL_ORDER = ["~", "&", "@", "%", "+"];

class ChannelUserList extends PureComponent {
	// TODO: Change into a wrapper of <UserList />?

	shouldComponentUpdate(newProps) {
		if (newProps) {
			const { channel, channelUserLists, lastSeenUsers } = this.props;

			// Only look at changes in the relevant user list, not all of them
			var oldUserList = channelUserLists && channelUserLists[channel];
			var newUserList = newProps.channelUserLists &&
			newProps.channelUserLists[newProps.channel];

			if (oldUserList !== newUserList) {
				return true;
			}

			// Look at the usernames amongst our friends
			if (this.monitoredUserNames && this.monitoredUserNames.length) {
				const mu = this.monitoredUserNames;
				for(var i = 0; i < mu.length; i++) {
					if (
						lastSeenUsers && newProps.lastSeenUsers &&
						lastSeenUsers[mu[i]] !== newProps.lastSeenUsers[mu[i]]
					) {
						return true;
					}
				}
			}
		}

		return false;
	}

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

		this.monitoredUserNames = [];

		if (userList) {
			const sortedList = this.sortedUserList(userList);
			userListNodes = sortedList.map((data) => {
				if (data) {
					const { userName, symbol } = data;
					const userData = lastSeenUsers[userName];

					if (userData) {
						this.monitoredUserNames.push(userName);
					}

					return <TimedUserItem
						contextChannel={channel}
						userData={userData}
						userName={userName}
						symbol={symbol}
						skipOld={false}
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
