import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import debounce from "lodash/debounce";

import { CHANGE_DEBOUNCE_MS } from "../constants";
import SettingsDetailView from "./SettingsDetailView.jsx";
import * as io from "../lib/io";

class SettingsNicknamesView extends PureComponent {
	constructor(props) {
		super(props);

		this.handleRemove = this.handleRemove.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
		this.renderItemPanel = this.renderItemPanel.bind(this);

		this.valueChangeHandlers = {};

		this.state = {
			selectedNickname: null
		};
	}

	// Cache the bound handler methods so they don't change on every render

	createValueChangeHandler(nickname, key) {
		const myChangeValue = debounce(this.handleValueChange, CHANGE_DEBOUNCE_MS);
		return (evt) => myChangeValue(nickname, key, evt.target.value);
	}

	getValueChangeHandler(nickname, key) {
		if (!this.valueChangeHandlers[nickname]) {
			this.valueChangeHandlers[nickname] = {};
		}

		if (!this.valueChangeHandlers[nickname][key]) {
			this.valueChangeHandlers[nickname][key] =
				this.createValueChangeHandler(nickname, key);
		}

		return this.valueChangeHandlers[nickname][key];
	}

	handleSelect(nickname) {
		this.setState({ selectedNickname: nickname });
	}

	handleAdd(nickname) {
		console.log("Tried to add nickname", nickname);
		io.addNickname(nickname.name);
	}

	handleRemove(nickname) {
		const { selectedNickname } = this.state;

		if (
			confirm(
				`Are you sure you want to remove the nickname ${nickname} entirely?`
			)
		) {
			console.log("Tried to remove nickname", nickname);
			io.removeNickname(nickname);

			if (selectedNickname && selectedNickname === nickname) {
				this.setState({ selectedNickname: null });
			}
		}
	}

	handleValueChange(nickname, key, value) {
		console.log("Tried to change nickname value", nickname, key, value);
		io.changeNicknameValue(nickname, key, value);
	}

	renderItemTextarea(item, key, value) {
		const changeHandler = this.getValueChangeHandler(item.nickname, key);

		if (value && value instanceof Array) {
			value = value.join("\n");
		}

		return (
			<textarea
				id={"item-" + key}
				defaultValue={value}
				onChange={changeHandler} />
		);
	}

	renderItemPanel(nickname) {
		const { nicknames } = this.props;
		const item = nicknames[nickname];

		return (
			<div>
				<h3>{ item.nickname }</h3>
				<p>Change the value of these fields to specify where you want this nickname to apply. Leave them empty if you want this nickname to apply everywhere.</p>
				<p>Type full names (without #). Separate by line breaks. Values are treated as case insensitive.</p>
				<p className="ta">
					<label htmlFor="item-serverBlacklist">
						Server name black list:
					</label>
					{ this.renderItemTextarea(
						item, "serverBlacklist", item.serverBlacklist) }
				</p>
				<p className="ta">
					<label htmlFor="item-serverWhitelist">
						Server name white list:
					</label>
					{ this.renderItemTextarea(
						item, "serverWhitelist", item.serverWhitelist) }
				</p>
				<p className="ta">
					<label htmlFor="item-channelBlacklist">
						Channel name black list:
					</label>
					{ this.renderItemTextarea(
						item, "channelBlacklist", item.channelBlacklist) }
				</p>
				<p className="ta">
					<label htmlFor="item-channelWhitelist">
						Channel name white list:
					</label>
					{ this.renderItemTextarea(
						item, "channelWhitelist", item.channelWhitelist) }
				</p>
			</div>
		);
	}

	render() {
		const { nicknames } = this.props;

		const nicknamesList = Object.keys(nicknames);
		nicknamesList.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

		return (
			<div key="main">
				<p>Nicknames are alternative words that highlight you when mentioned by another user.</p>
				<p>Nicknames can only contain letters, numbers, spaces, and simple punctuation.</p>
				<SettingsDetailView
					itemKindName="nickname"
					list={nicknamesList}
					onAdd={this.handleAdd}
					onRemove={this.handleRemove}
					onSelect={this.handleSelect}
					renderItemPanel={this.renderItemPanel}
					/>
			</div>
		);
	}
}

SettingsNicknamesView.propTypes = {
	nicknames: PropTypes.object
};

export default connect(({ nicknames }) => ({ nicknames }))(SettingsNicknamesView);
