import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

class SettingsView extends PureComponent {
	constructor(props) {
		super(props);

		this.settings = {
			web: [
				{
					name: "webPort",
					readableName: "Web port",
					type: "number",
					description: "The port number the web server should start at"
				},
				{
					name: "webPassword",
					readableName: "Web password",
					type: "password",
					description: "The password required to log in to use the client (does not have to be the same as any IRC passwords)"
				}
			],
			irc: [],
			behavior: [
				{
					name: "darkMode",
					readableName: "Dark mode",
					type: "bool",
					description: "Invert the colors of Pyramid, giving a dark experience"
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

	renderSetting(setting) {
		const { appConfig } = this.props;
		const { name, readableName, type, description } = setting;

		var prefixInput = null, mainInput = null;

		switch (type) {
			case "bool":
				prefixInput = <input
					type="checkbox"
					checked={appConfig[name]}
					key="input" />;
				break;
			default:
				mainInput = <input
					type={type}
					value={appConfig[name] || ""}
					key="input" />;
		}

		return (
			<div className="settings__setting" key={name}>
				<h3>{ prefixInput } { readableName }</h3>
				{ mainInput }
				<p>{ description }</p>
			</div>
		);
	}

	renderSection(name, settings) {
		return (
			<div className="settings__section" key={name}>
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

		return (
			<div className="chatview settingsview">
				<h1>Settings</h1>
				{ content }
			</div>
		);
	}
}

SettingsView.propTypes = {
	appConfig: PropTypes.object
};

export default connect(({ appConfig }) => ({ appConfig }))(SettingsView);
