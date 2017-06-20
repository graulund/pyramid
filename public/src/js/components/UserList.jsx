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

	renderUserItem(data, request) {
		let { key, style } = request;
		let { hideOldUsers = true, visible } = this.props;
		if (data && data.username) {
			let { username, lastSeen = {} } = data;
			return <TimedUserItem
				displayOnline
				username={username}
				lastSeenData={lastSeen}
				skipOld={hideOldUsers}
				style={style}
				visible={visible}
				key={key}
				/>;
		}
		return null;
	}

	render() {
		let { height, lastSeenUsers, sort, width } = this.props;

		let list = [];
		for (var username in lastSeenUsers) {
			let lastSeen = lastSeenUsers[username];
			list.push({ username, lastSeen });
		}

		return <SortedItemList
			getIdForItem={getDataUsername}
			height={height}
			id="userlist"
			list={list}
			noItemsText="No friends :("
			renderItem={this.renderUserItem}
			sort={sort}
			sortableNameForItem={sortableName}
			width={width}
			/>;
	}
}

UserList.propTypes = {
	height: PropTypes.number.isRequired,
	hideOldUsers: PropTypes.bool,
	lastSeenUsers: PropTypes.object,
	sort: PropTypes.string,
	visible: PropTypes.bool,
	width: PropTypes.number.isRequired
};

export default connect(({
	appConfig: { hideOldUsers },
	lastSeenUsers
}) => ({
	hideOldUsers,
	lastSeenUsers
}))(UserList);
