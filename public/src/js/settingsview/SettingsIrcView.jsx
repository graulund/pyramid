import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import debounce from "lodash/debounce";
import omit from "lodash/omit";

import SettingsDetailView from "./SettingsDetailView.jsx";
import SettingsPasswordInput from "./SettingsPasswordInput.jsx";
import { CHANGE_DEBOUNCE_MS, INPUT_SELECTOR } from "../constants";
import { ucfirst } from "../lib/formatting";
import * as io from "../lib/io";
import { refElSetter } from "../lib/refEls";

const channelSettings = [
	{
		name: "showUserEvents",
		readableName: "User event visibility settings for this channel",
		type: "enum",
		description: "How to handle join and part events",
		valueNames: [
			"Off",
			"Collapse presence (factory default)",
			"Collapse events into one line",
			"Show all"
		]
	}
];

class SettingsIrcView extends PureComponent {
	constructor(props) {
		super(props);

		this.onAddServer = this.onAddServer.bind(this);
		this.onAddSubmit = this.onAddSubmit.bind(this);
		this.onChangeValue = this.onChangeValue.bind(this);
		this.renderIrcChannelPanel = this.renderIrcChannelPanel.bind(this);

		this.eventHandlers = {};
		this.channelConfigChangeHandlers = {};
		this.valueChangeHandlers = {};

		this.els = {};
		this.setAddForm = refElSetter("addForm").bind(this);

		this.state = {
			newServer: { channels: {} },
			newServerName: null,
			showingAddForm: false
		};
	}

	componentDidUpdate(prevProps, prevState) {
		let { showingAddForm } = this.state;
		let { addForm } = this.els;

		// Automatically add focus to the first input element
		// if we just started showing a form

		if (addForm && showingAddForm && !prevState.showingAddForm) {
			let input = addForm.querySelector(INPUT_SELECTOR);

			if (input) {
				input.focus();
			}
		}
	}

	getChannelConfig(serverName, channelName) {
		let { ircConfigs } = this.props;
		let s = ircConfigs[serverName];

		if (s && s.channels && s.channels[channelName]) {
			return s.channels[channelName].channelConfig;
		}

		return null;
	}

	// Cache the bound handler methods so they don't change on every render

	createEventHandler(name) {
		return {
			addChannel: (c) => this.onAddChannel(name, c),
			renderChannelPanel: (c) => this.renderIrcChannelPanel(name, c),
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

	createChannelConfigChangeHandler(serverName, channelName, key) {
		const myChangeValue = debounce(this.onChannelConfigChangeValue, CHANGE_DEBOUNCE_MS);

		return {
			number: (evt) => myChangeValue(
				serverName, channelName, key, +evt.target.value
			)
		};
	}

	getChannelConfigChangeHandler(serverName, channelName, key) {
		// Cache the value change handlers so they don't change

		let id = [serverName, channelName, key].join("/");

		if (!this.channelConfigChangeHandlers[id]) {
			this.channelConfigChangeHandlers[id] =
				this.createChannelConfigChangeHandler(
					serverName, channelName, key
				);
		}

		return this.channelConfigChangeHandlers[id];
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
		const channelObj = typeof channel === "string" ? { name: channel } : channel;
		if (serverName) {
			io.addIrcChannel(serverName, channelName);
		}
		else {
			const { newServer } = this.state;
			const channels = { ...newServer.channels, [channelName]: channelObj };
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
				const channels = omit(newServer.channels, channelName);
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

	onChannelConfigChangeValue(serverName, channelName, key, value) {
		console.log(
			"Tried to set channel config value",
			serverName, channelName, key, value
		);

		if (typeof value === "number" && isNaN(value)) {
			console.warn("Denied setting a numeric value setting to NaN");
			return;
		}

		io.setChannelConfigValue(serverName, channelName, key, value);
	}

	onAddSubmit(evt) {
		const { newServer, newServerName } = this.state;
		evt.preventDefault();

		console.log("Tried to add server", newServerName, newServer);
		io.addIrcServer(newServerName, newServer);
		this.setState({
			newServer: { channels: {} },
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
			<div className="settings__add" key="add" ref={this.setAddForm}>
				<h3>Add IRC server &#8220;{ newServerName }&#8221;</h3>
				{ this.renderIrcConfigForm(newServer) }
				<button onClick={this.onAddSubmit}>Submit</button>
			</div>
		);
	}

	renderIrcChannelPanel(serverName, channelName) {

		// Current config
		let channelConfig = this.getChannelConfig(serverName, channelName) || {};

		// Form fields
		let fields = channelSettings.map((setting) => {
			let { description, name, notice, readableName, valueNames } = setting;

			// Change handler
			let changeHandler = this.getChannelConfigChangeHandler(
				serverName, channelName, name
			);

			let defaultValue = -1;

			if (channelConfig[name] && typeof channelConfig[name] === "number") {
				defaultValue = channelConfig[name];
			}

			let options = valueNames.map(
				(name, i) => <option key={i} value={i}>{ name }</option>
			);

			let input = (
				<select
					id={name}
					defaultValue={defaultValue}
					onChange={changeHandler.number}
					key="input">
					<option key="0" value="-1">Use default value</option>
					<optgroup label="Override default" key="1">
						{ options }
					</optgroup>
				</select>
			);

			return (
				<div className="settings__setting" key={name}>
					<h3>
						<label htmlFor={name}>{ readableName }</label>
					</h3>
					{ input }
					{ description ? <p>{ description }</p> : null }
					{ notice ? <p><em>{ notice }</em></p> : null }
				</div>
			);
		});

		return (
			<div>
				<h3>{ channelName }</h3>
				<p>You can override some of the default settings for this channel specifically.</p>
				{ fields }
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
					<SettingsDetailView
						itemKindName="channel"
						list={Object.keys(data.channels)}
						onAdd={eventHandler.addChannel}
						onRemove={eventHandler.removeChannel}
						renderItemPanel={eventHandler.renderChannelPanel}
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
			<div className="settings--irc" key="main">
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
