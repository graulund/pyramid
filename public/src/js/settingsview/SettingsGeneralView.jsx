import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import debounce from "lodash/debounce";

import { CHANGE_DEBOUNCE_MS } from "../constants";
import * as io from "../lib/io";

class SettingsGeneralView extends PureComponent {
	constructor(props) {
		super(props);

		this.settings = {
			web: [
				{
					name: "webPort",
					readableName: "Web port",
					type: "number",
					description: "The port number the web server should listen to (requires server restart)"
				},
				{
					name: "webPassword",
					readableName: "Web password",
					type: "password",
					description: "The password required to log in to use the client (does not have to be the same as any IRC passwords)"
				}
			],
			behavior: [
				{
					name: "darkMode",
					readableName: "Dark mode",
					type: "bool",
					description: "Invert the colors of Pyramid, giving a dark experience (requires reload in your browser)"
				},
				{
					name: "logLinesDb",
					readableName: "Log lines in the database",
					type: "bool",
					description: "Log all chat lines in the database; saves meta data but takes up disk space"
				},
				{
					name: "logLinesFile",
					readableName: "Log lines to text files",
					type: "bool",
					description: "Log all chat lines to separate text files for each channel and date; does not save meta data, but is saved in a universal human readable plain text format"
				},
				{
					name: "debug",
					readableName: "Debug mode (developers only)",
					type: "bool",
					description: "Display extra information in the console"
				}
			]
		};
	}

	handleValueChange(name, value) {
		console.log("Tried to set value", name, value);
		io.setAppConfigValue(name, value);
	}

	renderSetting(setting) {
		const { appConfig } = this.props;
		const { name, readableName, type, description } = setting;

		var prefixInput = null, mainInput = null;

		const myChangeValue = debounce(this.handleValueChange, CHANGE_DEBOUNCE_MS);

		switch (type) {
			case "bool":
				prefixInput = <input
					type="checkbox"
					id={name}
					defaultChecked={appConfig[name]}
					onChange={(evt) => myChangeValue(name, evt.target.checked)}
					key="input" />;
				break;
			default:
				mainInput = <input
					type={type}
					id={name}
					defaultValue={appConfig[name] || ""}
					onChange={(evt) => myChangeValue(name, evt.target.value)}
					key="input" />;
		}

		return (
			<div className="settings__setting" key={name}>
				<h3>{ prefixInput } <label htmlFor={name}>{ readableName }</label></h3>
				{ mainInput }
				<p>{ description }</p>
			</div>
		);
	}

	renderSection(name, settings) {
		return (
			<div className="settings__section" key={name}>
				<h2>{ name }</h2>
				{ settings.map((setting) => this.renderSetting(setting)) }
			</div>
		);
	}

	render() {
		var content = [];
		Object.keys(this.settings).forEach((sectionName) => {
			if (this.settings[sectionName]) {
				content.push(this.renderSection(sectionName, this.settings[sectionName]));
			}
		});

		return <div key="main">{ content }</div>;
	}
}

SettingsGeneralView.propTypes = {
	appConfig: PropTypes.object
};

export default connect(({ appConfig }) => ({ appConfig }))(SettingsGeneralView);
