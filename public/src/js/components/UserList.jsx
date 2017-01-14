import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import TimedUserItem from "./TimedUserItem.jsx";

class UserList extends PureComponent {
	render() {
		const { lastSeenUsers, sort } = this.props;

		var usernames;

		if (sort === "activity") {
			// Sort by last activity
			var datas = [];
			for(var username in lastSeenUsers) {
				var data = lastSeenUsers[username];
				if (data) {
					datas.push({ username, time: data.time });
				}
			}
			datas.sort((a, b) => {
				if (a && b) {
					return -1 * a.time.localeCompare(b.time);
				}
				return 1;
			});
			usernames = datas.map((data) => data.username);
		} else {
			// Sort by username
			usernames = Object.keys(lastSeenUsers);
			usernames.sort();
		}

		const userListNodes = usernames.map((userName) => {
			const userData = lastSeenUsers[userName];
			return <TimedUserItem userData={userData} userName={userName} key={userName} />;
		});

		return <ul id="userlist" className="itemlist">{ userListNodes }</ul>;
	}
}

UserList.propTypes = {
	sort: PropTypes.string,
	lastSeenUsers: PropTypes.object
};

export default connect(({ lastSeenUsers }) => ({ lastSeenUsers }))(UserList);
