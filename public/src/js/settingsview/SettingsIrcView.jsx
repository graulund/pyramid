import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import SettingsList from "./SettingsList.jsx";
import { ucfirst } from "../lib/formatting";

class SettingsIrcView extends PureComponent {
	constructor(props) {
		super(props);

		this.onAddServer = this.onAddServer.bind(this);
	}

	onAddServer() {
		var name = prompt(
			"Please type a name for the new server. " +
			"It is only for your own identification, but it cannot be changed."
		);
		if (name) {
			console.log("Tried to add server", name);
		}
	}

	onRemoveServer(serverName) {
		if (confirm(`Are you sure you want to remove the server ${serverName} entirely?`)) {
			console.log("Tried to remove server", serverName);
		}
	}

	onAddChannel(serverName, channel) {
		console.log("Tried to add channel", serverName, channel);
	}

	onRemoveChannel(serverName, channel) {
		if (confirm(`Are you sure you want to remove the channel ${channel.name}?`)) {
			console.log("Tried to remove channel", serverName, channel);
		}
	}

	onChangeValue(serverName, id, value) {
		console.log("Tried to set value", serverName, id, value);
	}

	renderLine(serverName, id, value, type = "text", readableName = "") {

		const onChange = (evt) => {
			this.onChangeValue(serverName, id, evt.target.value);
		};

		if (type === "checkbox") {

			const onCheckboxChange = (evt) => {
				this.onChangeValue(serverName, id, evt.target.checked);
			};

			return (
				<p>
					<input
						type={type} id={id} name={id} defaultChecked={!!value}
						onChange={onCheckboxChange}
						/>
					<label htmlFor={id}>{ (readableName || ucfirst(id)) + " " }</label>
				</p>
			);
		}

		return (
			<p className="l">
				<label htmlFor={id}>{ (readableName || ucfirst(id)) + " " }</label>
				<input
					type={type} id={id} name={id} defaultValue={value || ""}
					onChange={onChange}
					/>
			</p>
		);
	}

	renderIrcConfig(data) {
		return (
			<div className="settings__container" key={data.name}>
				<div className="settings__rightcontrol">
					<button onClick={() => this.onRemoveServer(data.name)}>
						Remove server
					</button>
				</div>
				<h1>{ data.name }</h1>
				<div className="settings__section" key="metadata">
					<h2>Metadata</h2>
					<p>If you change this data, a Pyramid restart is required for it to go into effect.</p>
					{ this.renderLine(data.name, "hostname", data.hostname) }
					{ this.renderLine(data.name, "port", data.port, "number") }
					{ this.renderLine(data.name, "nickname", data.nickname) }
					{ this.renderLine(data.name, "username", data.username) }
					{ this.renderLine(data.name, "password", data.password, "password") }
					{ this.renderLine(data.name, "realname", data.realname, "text", "Real name") }
					{
						this.renderLine(
							data.name,
							"secure",
							data.secure,
							"checkbox",
							"Connect securely"
						)
					}
					{
						this.renderLine(
							data.name,
							"selfSigned",
							data.selfSigned,
							"checkbox",
							"Accept self-signed certificate"
						)
					}
					{
						this.renderLine(
							data.name,
							"certExpired",
							data.certExpired,
							"checkbox",
							"Accept expired certificate"
						)
					}
				</div>
				<div className="settings__section" key="channels">
					<h2>Channels</h2>
					<SettingsList
						itemKindName="channel"
						list={data.channels}
						onAdd={(c) => this.onAddChannel(data.name, c)}
						onRemove={(c) => this.onRemoveChannel(data.name, c)}
					/>
				</div>
			</div>
		);
	}
	render() {
		const { ircConfigs } = this.props;
		const configs = Object.values(ircConfigs);

		return (
			<div key="main">
				<button onClick={this.onAddServer}>
					Add IRC server
				</button>
				{ configs.map((c) => this.renderIrcConfig(c)) }
			</div>
		);
	}
}

SettingsIrcView.propTypes = {
	ircConfigs: PropTypes.object
};

export default connect(({ ircConfigs }) => ({ ircConfigs }))(SettingsIrcView);
