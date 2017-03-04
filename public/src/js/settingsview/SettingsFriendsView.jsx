import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";

import SettingsList from "./SettingsList.jsx";

class SettingsFriendsView extends PureComponent {
	constructor(props) {
		super(props);

		this.renderLevelSelector = this.renderLevelSelector.bind(this);
	}

	onAdd(friend) {
		console.log("Tried to add friend", friend);
	}

	onRemove(friend) {
		if (confirm(`Are you sure you want to remove ${friend.name} as a friend?`)) {
			console.log("Tried to remove friend", friend);
		}
	}

	onChangeLevel(friend, level) {
		console.log("Tried to change friend level", friend, level);
	}

	renderLevelSelector(friend) {
		const onChange = friend
			? (evt) => this.onChangeLevel(friend, evt.target.value)
			: null;
		return (
			<select defaultValue={friend && friend.level} onChange={onChange}>
				<option value="1">Friend</option>
				<option value="2">Best friend</option>
			</select>
		);
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

		return <SettingsList
			extraColumn={this.renderLevelSelector}
			extraColumnName="level"
			itemKindName="friend"
			list={allFriends}
			onAdd={this.onAdd}
			onRemove={this.onRemove}
		/>;
	}
}

SettingsFriendsView.propTypes = {
	friendsList: PropTypes.object
};

export default connect(({ friendsList }) => ({ friendsList }))(SettingsFriendsView);
