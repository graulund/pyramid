import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import debounce from "lodash/debounce";

import SettingsPasswordInput from "./SettingsPasswordInput.jsx";
import { CHANGE_DEBOUNCE_MS, RESTRICTED_APP_CONFIG_PROPERTIES } from "../constants";
import * as io from "../lib/io";

class SettingsAppConfigView extends PureComponent {
	constructor(props) {
		super(props);

		if (props.useSystemInfo) {
			io.requestSystemInfo();
		}

		this.valueChangeHandlers = {};
	}

	createValueChangeHandler(name) {
		const myChangeValue = debounce(this.handleValueChange, CHANGE_DEBOUNCE_MS);

		return {
			bool: (evt) => myChangeValue(name, evt.target.checked),
			number: (evt) => myChangeValue(name, +evt.target.value),
			string: (evt) => myChangeValue(name, evt.target.value)
		};
	}

	getValueChangeHandler(name) {
		// Cache the value change handlers so they don't change

		if (!this.valueChangeHandlers[name]) {
			this.valueChangeHandlers[name] = this.createValueChangeHandler(name);
		}

		return this.valueChangeHandlers[name];
	}

	handleValueChange(name, value) {
		console.log("Tried to set value", name, value);

		if (name === "webPassword" && !value) {
			console.warn("Denied setting web password to empty");
			return;
		}

		if (typeof value === "number" && isNaN(value)) {
			console.warn("Denied setting a numeric value setting to NaN");
			return;
		}

		io.setAppConfigValue(name, value);
	}

	renderSetting(setting) {
		let { appConfig, systemInfo } = this.props;
		let {
			description,
			min,
			max,
			name,
			notice,
			readableName,
			requires,
			type
		} = setting;

		var prefixInput = null, mainInput = null, isDisabled = false;

		// Do not show the field if we're in restricted mode and it's restricted

		if (
			appConfig.restrictedMode &&
			RESTRICTED_APP_CONFIG_PROPERTIES.indexOf(name) >= 0
		) {
			return null;
		}

		// Disable the field if any of its prerequisites are disabled
		if (requires && requires.length) {
			requires.forEach((fieldName) => {
				if (appConfig && !appConfig[fieldName]) {
					isDisabled = true;
				}
			});
		}

		// Change handler
		const changeHandler = this.getValueChangeHandler(name);

		// Input field
		switch (type) {

			case "bool":
				prefixInput = <input
					type="checkbox"
					id={name}
					defaultChecked={appConfig[name]}
					onChange={changeHandler.bool}
					disabled={isDisabled}
					key="input" />;
				break;

			case "enum":
				var options = null, defaultValue = appConfig[name];
				var ch = changeHandler.string;

				if (setting.valuePairs) {
					options = setting.valuePairs.map((pair, i) => {
						let key = pair[0], name = pair[1];
						return <option key={i} value={key}>{ name }</option>;
					});
				}
				else if (setting.valueNames) {
					// Assume numeric values
					defaultValue = +appConfig[name] || 0;
					ch = changeHandler.number;
					options = setting.valueNames.map(
						(name, i) => <option key={i} value={i}>{ name }</option>
					);
				}

				mainInput = (
					<select
						id={name}
						defaultValue={defaultValue}
						onChange={ch}
						disabled={isDisabled}
						key="input">
						{ options }
					</select>
				);
				break;

			case "password":
				var { emptiable = true } = setting;
				mainInput = <SettingsPasswordInput
					type={type}
					id={name}
					defaultValue={appConfig[name] || ""}
					onChange={changeHandler.string}
					disabled={isDisabled}
					emptiable={emptiable}
					key="input"
					/>;
				break;

			default: {
				let handler = type === "number"
					? changeHandler.number
					: changeHandler.string;
				mainInput = <input
					type={type}
					id={name}
					defaultValue={appConfig[name] || ""}
					onChange={handler}
					disabled={isDisabled}
					min={min}
					max={max}
					key="input" />;
			}
		}

		// Class name
		const className = "settings__setting" +
			(isDisabled ? " settings__setting--disabled" : "");

		// Output

		if (prefixInput) {
			prefixInput = [prefixInput, " "];
		}

		var suffix = null;

		if (name === "retainDbType" && systemInfo.databaseSize) {
			const dbSizeMb = (systemInfo.databaseSize / 1024 / 1024).toFixed(2);
			suffix = <p><em>Current database size: { dbSizeMb } MB. Clear your database by running the <tt>clearDatabaseLogs.sh</tt> shell script in the <tt>scripts</tt> folder while Pyramid is turned off.</em></p>;
		}

		if (name === "logLinesFile" && systemInfo.logFolderSize) {
			const lfSizeMb = (systemInfo.logFolderSize / 1024 / 1024).toFixed(2);
			suffix = <p><em>Current log folder size: { lfSizeMb } MB. Clear the log folder by running the <tt>clearLogFolder.sh</tt> shell script in the <tt>scripts</tt> folder while Pyramid is turned off.</em></p>;
		}

		if (name === "enableDarkMode") {
			notice = [
				"Switch quickly with ",
				(
					<a
						href="https://en.wikipedia.org/wiki/Access_key"
						target="_blank" rel="noopener noreferrer"
						key="access-key-info">
						access key
					</a>
				),
				" K"
			];
		}

		return (
			<div className={className} key={name}>
				<h3>
					{ prefixInput }
					<label htmlFor={name}>{ readableName }</label>
				</h3>
				{ mainInput ? <p>{ mainInput }</p> : null }
				{ description ? <p>{ description }</p> : null }
				{ notice ? <p><em>{ notice }</em></p> : null }
				{ suffix }
			</div>
		);
	}

	renderSection(name, settings) {
		let settingItems = settings.map(
			(setting) => this.renderSetting(setting)
		);

		// Ensure there's at least one non-null value

		let hasValue = false;

		if (settingItems && settingItems.length) {
			settingItems.forEach((s) => {
				if (s) {
					hasValue = true;
				}
			});
		}

		if (!hasValue) {
			return null;
		}

		return (
			<div className="settings__section" key={name}>
				<h2>{ name }</h2>
				{ settingItems }
			</div>
		);
	}

	render() {
		let { settings } = this.props;
		let content = [];

		// TODO: Restrict view with restriction mode turned on

		Object.keys(settings).forEach((sectionName) => {
			if (settings[sectionName]) {
				content.push(this.renderSection(sectionName, settings[sectionName]));
			}
		});

		return <div>{ content }</div>;
	}
}

SettingsAppConfigView.propTypes = {
	appConfig: PropTypes.object,
	settings: PropTypes.object.isRequired,
	systemInfo: PropTypes.object,
	useSystemInfo: PropTypes.bool
};

export default connect(({
	appConfig,
	systemInfo
}) => ({
	appConfig,
	systemInfo
}))(SettingsAppConfigView);
