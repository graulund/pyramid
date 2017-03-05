import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import debounce from "lodash/debounce";
import without from "lodash/without";

import SettingsList from "./SettingsList.jsx";
import { CHANGE_DEBOUNCE_MS, INPUT_SELECTOR } from "../constants";
import { ucfirst } from "../lib/formatting";
import * as io from "../lib/io";

class SettingsIrcView extends PureComponent {
	constructor(props) {
		super(props);

		this.onAddServer = this.onAddServer.bind(this);
		this.onAddSubmit = this.onAddSubmit.bind(this);
		this.onChangeValue = this.onChangeValue.bind(this);

		this.state = {
			newServer: { channels: [] },
			newServerName: null,
			showingAddForm: false
		};
	}

	componentDidUpdate(prevProps, prevState) {
		const { showingAddForm } = this.state;
		const { addForm } = this.refs;

		// Automatically add focus to the first input element
		// if we just started showing a form

		if (addForm && showingAddForm && !prevState.showingAddForm) {
			const input = addForm.querySelector(INPUT_SELECTOR);

			if (input) {
				input.focus();
			}
		}
	}

	showAddForm() {
		this.setState({ showingAddForm: true });
	}

	onAddServer() {
		var newServerName = prompt(
			"Please type a name for the new server. " +
			"It is only for your own identification, but it cannot be changed."
		);
		if (newServerName) {
			console.log("Started process to add server", newServerName);
			this.setState({ newServerName });
			this.showAddForm();
		}
	}

	onRemoveServer(serverName) {
		if (confirm(`Are you sure you want to remove the server ${serverName} entirely?`)) {
			console.log("Tried to remove server", serverName);
			io.removeIrcServer(serverName);
		}
	}

	onAddChannel(serverName, channel) {
		console.log("Tried to add channel", serverName, channel);
		const channelName = channel.name || channel;
		if (serverName) {
			io.addIrcChannel(serverName, channelName);
		}
		else {
			const { newServer } = this.state;
			const channels = [...newServer.channels, channelName];
			this.setState({ newServer: { ...newServer, channels } });
		}
	}

	onRemoveChannel(serverName, channel) {
		const channelName = channel.name || channel;
		if (confirm(`Are you sure you want to remove the channel ${channelName}?`)) {
			console.log("Tried to remove channel", serverName, channel);
			if (serverName) {
				io.removeIrcChannel(serverName, channelName);
			}
			else {
				const { newServer } = this.state;
				const channels = without(newServer.channels, channelName);
				this.setState({ newServer: { ...newServer, channels } });
			}
		}
	}

	onChangeValue(serverName, id, value) {
		console.log("Tried to set value", serverName, id, value);
		if (serverName) {
			io.changeIrcServer(serverName, { [id]: value });
		}
		else {
			const { newServer } = this.state;
			this.setState({ newServer: { ...newServer, [id]: value } });
		}
	}

	onAddSubmit(evt) {
		const { newServer, newServerName } = this.state;
		evt.preventDefault();

		console.log("Tried to add server", newServerName, newServer);
		io.addIrcServer(newServerName, newServer);
		this.setState({
			newServer: { channels: [] },
			newServerName: null,
			showingAddForm: false
		});
	}

	renderLine(serverName, id, value, type = "text", readableName = "") {

		const myChangeValue = debounce(this.onChangeValue, CHANGE_DEBOUNCE_MS);

		const onChange = (evt) => {
			myChangeValue(serverName, id, evt.target.value);
		};

		if (type === "checkbox") {

			const onCheckboxChange = (evt) => {
				myChangeValue(serverName, id, evt.target.checked);
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

	renderAddForm() {
		const { newServer, newServerName } = this.state;
		return (
			<div className="settings__add" key="add" ref="addForm">
				<h3>Add IRC server &#8220;{ newServerName }&#8221;</h3>
				{ this.renderIrcConfigForm(newServer) }
				<button onClick={this.onAddSubmit}>Submit</button>
			</div>
		);
	}

	renderIrcConfigForm(data) {
		return (
			<div>
				<div className="settings__section" key="metadata">
					<h2>Meta data</h2>
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

	renderIrcConfig(data) {
		return (
			<div className="settings__container" key={data.name}>
				<div className="settings__rightcontrol">
					<button onClick={() => this.onRemoveServer(data.name)}>
						Remove server
					</button>
				</div>
				<h1>{ data.name }</h1>
				<p>If you change the meta data, a Pyramid restart is required for it to go into effect.</p>
				{ this.renderIrcConfigForm(data) }
			</div>
		);
	}
	render() {
		const { ircConfigs } = this.props;
		const { showingAddForm } = this.state;

		const configs = Object.values(ircConfigs);
		const adder = showingAddForm
					? this.renderAddForm()
					: <button onClick={this.onAddServer}>Add IRC server</button>;

		return (
			<div key="main">
				{ adder }
				{ configs.map((c) => this.renderIrcConfig(c)) }
			</div>
		);
	}
}

SettingsIrcView.propTypes = {
	ircConfigs: PropTypes.object
};

export default connect(({ ircConfigs }) => ({ ircConfigs }))(SettingsIrcView);
