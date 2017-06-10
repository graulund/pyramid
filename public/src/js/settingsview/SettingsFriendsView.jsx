import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";

import SettingsList from "./SettingsList.jsx";
import * as io from "../lib/io";

class SettingsFriendsView extends PureComponent {
	constructor(props) {
		super(props);

		this.renderLevelSelector = this.renderLevelSelector.bind(this);
	}

	handleAdd(friend) {
		console.log("Tried to add friend", friend);
		io.addNewFriend(friend.name, friend.level);
	}

	handleRemove(friend) {
		if (confirm(`Are you sure you want to remove ${friend.name} as a friend?`)) {
			console.log("Tried to remove friend", friend);
			io.removeFriend(friend.name);
		}
	}

	handleChangeLevel(friend, level) {
		console.log("Tried to change friend level", friend, level);
		io.changeFriendLevel(friend.name, level);
	}

	renderLevelSelector(friend) {
		const onChange = friend
			? (evt) => this.handleChangeLevel(friend, evt.target.value)
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

		allFriends.sort(
			(a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())
		);

		return <SettingsList
			extraColumn={this.renderLevelSelector}
			extraColumnName="level"
			extraColumnDefaultValue={1}
			itemKindName="friend"
			list={allFriends}
			onAdd={this.handleAdd}
			onRemove={this.handleRemove}
		/>;
	}
}

SettingsFriendsView.propTypes = {
	friendsList: PropTypes.object
};

export default connect(({ friendsList }) => ({ friendsList }))(SettingsFriendsView);
