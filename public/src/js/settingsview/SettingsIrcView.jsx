import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import debounce from "lodash/debounce";
import without from "lodash/without";

import SettingsList from "./SettingsList.jsx";
import SettingsPasswordInput from "./SettingsPasswordInput.jsx";
import { CHANGE_DEBOUNCE_MS, INPUT_SELECTOR } from "../constants";
import { ucfirst } from "../lib/formatting";
import * as io from "../lib/io";

class SettingsIrcView extends PureComponent {
	constructor(props) {
		super(props);

		this.onAddServer = this.onAddServer.bind(this);
		this.onAddSubmit = this.onAddSubmit.bind(this);
		this.onChangeValue = this.onChangeValue.bind(this);

		this.eventHandlers = {};
		this.valueChangeHandlers = {};

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

	// Cache the bound handler methods so they don't change on every render

	createEventHandler(name) {
		return {
			addChannel: (c) => this.onAddChannel(name, c),
			removeChannel: (c) => this.onRemoveChannel(name, c),
			removeServer: () => this.onRemoveServer(name)
		};
	}

	createValueChangeHandler(serverName, id) {
		const myChangeValue = debounce(this.onChangeValue, CHANGE_DEBOUNCE_MS);

		return {
			bool: (evt) => myChangeValue(serverName, id, evt.target.checked),
			string: (evt) => myChangeValue(serverName, id, evt.target.value)
		};
	}

	getEventHandler(name) {
		if (!this.eventHandlers[name]) {
			this.eventHandlers[name] = this.createEventHandler(name);
		}

		return this.eventHandlers[name];
	}

	getValueChangeHandler(serverName, id) {
		if (!this.valueChangeHandlers[serverName]) {
			this.valueChangeHandlers[serverName] = {};
		}

		if (!this.valueChangeHandlers[serverName][id]) {
			this.valueChangeHandlers[serverName][id] =
				this.createValueChangeHandler(serverName, id);
		}

		return this.valueChangeHandlers[serverName][id];
	}

	showAddForm() {
		this.setState({ showingAddForm: true });
	}

	onAddServer() {
		var newServerName = prompt(
			"Please type a name for the new server. " +
			"It is only for your own identification, but it cannot be changed. " +
			"Spaces and / are not allowed."
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

		const changeHandler = this.getValueChangeHandler(serverName, id);

		const label = (
			<label htmlFor={id}>{ (readableName || ucfirst(id)) + " " }</label>
		);

		if (type === "checkbox") {

			return (
				<p>
					<input
						type={type} id={id} name={id} defaultChecked={!!value}
						onChange={changeHandler.bool}
						/>
					{ label }
				</p>
			);
		}

		var input;

		if (type === "password") {
			input = <SettingsPasswordInput emptiable
				type={type} id={id} name={id} defaultValue={value || ""}
				onChange={changeHandler.string}
				/>;
		}
		else {
			input = <input
				type={type} id={id} name={id} defaultValue={value || ""}
				onChange={changeHandler.string}
				/>;
		}

		return (
			<p className="l">
				{ label }
				{ input }
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
		const eventHandler = this.getEventHandler(data.name);

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
						onAdd={eventHandler.addChannel}
						onRemove={eventHandler.removeChannel}
					/>
				</div>
			</div>
		);
	}

	renderIrcConfig(data) {
		const eventHandler = this.getEventHandler(data.name);

		return (
			<div className="settings__container" key={data.name}>
				<div className="settings__rightcontrol">
					<button onClick={eventHandler.removeServer}>
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
