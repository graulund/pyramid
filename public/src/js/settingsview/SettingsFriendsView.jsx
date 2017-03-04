import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";

class SettingsFriendsView extends PureComponent {
	renderLevelName(level) {
		if (level === 1) {
			return "Friend";
		}
		if (level === 2) {
			return "Best friend";
		}

		return "";
	}

	render() {
		const { friendsList } = this.props;

		var allFriends = [];

		forOwn(friendsList, (list, level) => {
			allFriends = allFriends.concat(
				list.map((name) => ({ name, level: parseInt(level) }))
			);
		});

		allFriends.sort((a, b) => a.name < b.name ? -1 : 1);

		return (
			<div key="main">
				<button>Add friend</button>
				<ul className="settings__list">
					{
						allFriends.map((friend) => (
							<li className="settings__list-item" key={friend.name}>
								<strong>{ friend.name }</strong>
								<em>{ this.renderLevelName(friend.level) }</em>
								<button>Remove friend</button>
							</li>
						))
					}
				</ul>
			</div>
		);
	}
}

SettingsFriendsView.propTypes = {
	friendsList: PropTypes.object
};

export default connect(({ friendsList }) => ({ friendsList }))(SettingsFriendsView);
