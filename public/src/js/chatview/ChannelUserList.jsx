import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";
import without from "lodash/without";

import TimedUserItem from "../components/TimedUserItem.jsx";

const USER_SYMBOL_ORDER = ["~", "&", "@", "%", "+"];

class ChannelUserList extends PureComponent {
	// TODO: Change into a wrapper of <UserList />?

	groupUserList(userList) {
		var output = {};

		forOwn(userList, (data, username) => {
			let { symbol } = data;

			if (!output[symbol]) {
				output[symbol] = [];
			}

			output[symbol].push({ username, ...data });
		});

		forOwn(output, (list) => {
			list.sort(function(a, b) {
				if (a && b) {
					return a.username.toLowerCase()
						.localeCompare(b.username.toLowerCase());
				}
				return -1;
			});
		});

		return output;
	}

	sortedUserList(userList) {
		var output = [];
		const grouped = this.groupUserList(userList);
		const groups = Object.keys(grouped);

		if (!grouped || !groups || !groups.length) {
			return output;
		}

		// Default promoted symbols in order
		const addUsersOfSymbol = (symbol) => {
			if (grouped[symbol]) {
				output = output.concat(grouped[symbol]);
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
		const { channel, lastSeenUsers, userList } = this.props;

		var userListNodes = null;

		if (userList) {
			const sortedList = this.sortedUserList(userList);
			userListNodes = sortedList.map((data) => {
				if (data) {
					let { displayName, username, symbol } = data;
					let lastSeen = lastSeenUsers[username];

					return <TimedUserItem
						contextChannel={channel}
						displayName={displayName}
						lastSeenData={lastSeen}
						skipOld={false}
						symbol={symbol}
						username={username}
						visible={true}
						key={username} />;
				}
			});
		}

		return (
			<ul className="channeluserlist itemlist">{ userListNodes }</ul>
		);
	}
}

ChannelUserList.propTypes = {
	channel: PropTypes.string,
	lastSeenUsers: PropTypes.object,
	userList: PropTypes.object
};

const mapStateToProps = function(state, ownProps) {
	let { channel } = ownProps;
	let { channelUserLists, lastSeenUsers } = state;

	return {
		lastSeenUsers,
		userList: channelUserLists[channel]
	};
};

export default connect(mapStateToProps)(ChannelUserList);
