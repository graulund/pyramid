import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import debounce from "lodash/debounce";

import { CHANGE_DEBOUNCE_MS } from "../constants";
import SettingsList from "./SettingsList.jsx";
import * as io from "../lib/io";

class SettingsNicknamesView extends PureComponent {
	constructor(props) {
		super(props);

		this.handleRemove = this.handleRemove.bind(this);
		this.handleSelect = this.handleSelect.bind(this);

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

	handleRemove(nickname, evt) {
		const { selectedNickname } = this.state;

		evt.stopPropagation();

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

	renderItemPanel(item) {
		const { selectedNickname } = this.state;

		var style;

		if (item) {
			style = item.nickname === selectedNickname ? {} : { display: "none" };
			return (
				<div className="settings__detail-item" key={item.nickname} style={style}>
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

		style = !selectedNickname ? {} : { display: "none" };

		return (
			<div className="settings__detail-noitem" key="noitem" style={style}>
				<p>Select an item.</p>
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
				<div className="settings__detail-view">
					<SettingsList
						itemKindName="nickname"
						list={nicknamesList}
						onAdd={this.handleAdd}
						onRemove={this.handleRemove}
						onSelect={this.handleSelect}
						/>
					{
						nicknamesList.map((nickname) => {
							return this.renderItemPanel(nicknames[nickname]);
						})
					}
					{ this.renderItemPanel(null) }
				</div>
			</div>
		);
	}
}

SettingsNicknamesView.propTypes = {
	nicknames: PropTypes.object
};

export default connect(({ nicknames }) => ({ nicknames }))(SettingsNicknamesView);
