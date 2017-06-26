import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import SortedItemList from "./SortedItemList.jsx";
import TimedUserItem from "./TimedUserItem.jsx";

const sortableName = function(item) {
	let name = item.username;
	return name.toLowerCase();
};

const getDataUsername = function(data) {
	return data && data.username;
};

class UserList extends PureComponent {
	constructor(props) {
		super(props);

		this.renderUserItem = this.renderUserItem.bind(this);
	}

	renderUserItem(data) {
		let {
			hideOldUsers = true,
			ignoreUsernames = [],
			visible
		} = this.props;

		if (
			data &&
			data.username &&
			ignoreUsernames.indexOf(data.username) < 0
		) {
			let { username, lastSeen = {} } = data;
			return <TimedUserItem
				displayOnline
				username={username}
				lastSeenData={lastSeen}
				skipOld={hideOldUsers}
				visible={visible}
				key={username}
				/>;
		}

		return null;
	}

	render() {
		const { lastSeenUsers, sort } = this.props;

		let list = [];
		for (var username in lastSeenUsers) {
			let lastSeen = lastSeenUsers[username];
			list.push({ username, lastSeen });
		}

		return <SortedItemList
			getIdForItem={getDataUsername}
			id="userlist"
			list={list}
			noItemsText="No friends :("
			renderItem={this.renderUserItem}
			sort={sort}
			sortableNameForItem={sortableName}
			/>;
	}
}

UserList.propTypes = {
	hideOldUsers: PropTypes.bool,
	ignoreUsernames: PropTypes.array,
	lastSeenUsers: PropTypes.object,
	sort: PropTypes.string,
	visible: PropTypes.bool
};

export default connect(({
	appConfig: { hideOldUsers },
	lastSeenUsers
}) => ({
	hideOldUsers,
	lastSeenUsers
}))(UserList);
