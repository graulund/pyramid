import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import debounce from "lodash/debounce";

import SettingsPasswordInput from "./SettingsPasswordInput.jsx";
import VersionNumber from "../components/VersionNumber.jsx";
import { CHANGE_DEBOUNCE_MS } from "../constants";
import * as io from "../lib/io";
import { timeZoneFormattedList } from "../lib/timeZones";

class SettingsGeneralView extends PureComponent {
	constructor(props) {
		super(props);

		io.requestSystemInfo();

		this.settings = {
			"Web": [
				{
					name: "webPort",
					readableName: "Web port",
					type: "number",
					description: "The port number the web server should listen to",
					notice: "Requires server restart"
				},
				{
					name: "webPassword",
					readableName: "Web password",
					type: "password",
					description: "The password required to log in to use the client (does not have to be the same as any IRC passwords)",
					notice: "Must not be empty",
					emptiable: false
				}
			],
			"Time zone": [
				{
					name: "timeZone",
					readableName: "Your time zone",
					type: "enum",
					valuePairs: timeZoneFormattedList()
				}
			],
			"Storage": [
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
				}
			],
			"Appearance": [
				{
					name: "enableDarkMode",
					readableName: "Dark mode",
					type: "bool",
					description: "Invert the colors of Pyramid, giving a dark experience"
				},
				{
					name: "enableUsernameColors",
					readableName: "Username colors",
					type: "bool",
					description: "Enable automatically generated username colors"
				},
				{
					name: "enableEmojiCodes",
					readableName: "Emoji codes",
					type: "bool",
					description: "Converts type codes like :thinking: to emoji like 🤔"
				},
				{
					name: "enableEmojiImages",
					readableName: "Emoji images",
					type: "bool",
					description: "Shows emojis as images, so systems without unicode support can still display them"
				},
				{
					name: "hideOldUsers",
					readableName: "Hide silent users in sidebar",
					type: "bool",
					description: "Hide users that haven't spoken for a long time on the users list",
					notice: "Users we have never heard from are never shown"
				},
				{
					name: "hideOldChannels",
					readableName: "Hide silent channels in sidebar",
					type: "bool",
					description: "Hide channels that haven't been spoken in for a long time on the channels list",
					notice: "Doesn't affect your joined status"
				},
				{
					name: "collapseJoinParts",
					readableName: "Collapse join/part events",
					type: "bool",
					description: "If someone joins and immediately leaves, don't display anything"
				}
			],
			"Twitch": [
				{
					name: "enableTwitch",
					readableName: "Enable Twitch",
					type: "bool",
					description: "Enable special features for Twitch"
				},
				{
					name: "automaticallyJoinTwitchGroupChats",
					readableName: "Automatically join Twitch group chats",
					type: "bool",
					description: "Automatically join all the group chats that you are invited to on Twitch",
					requires: ["enableTwitch"]
				},
				{
					name: "enableTwitchColors",
					readableName: "Enable Twitch username colors",
					type: "bool",
					description: "Show the username colors set by users on Twitch",
					requires: ["enableTwitch"]
				},
				{
					name: "enableTwitchChannelDisplayNames",
					readableName: "Enable Twitch channel display names",
					type: "bool",
					description: "Show the real names of group chats on Twitch",
					requires: ["enableTwitch"]
				},
				{
					name: "enableTwitchUserDisplayNames",
					readableName: "Enable Twitch user display names",
					type: "enum",
					description: "Show the display names set by users on Twitch",
					requires: ["enableTwitch"],
					valueNames: [
						"Off",
						"Case changes only",
						"All display names"
					]
				},
				{
					name: "enableFfzEmoticons",
					readableName: "Enable FrankerFaceZ emoticons",
					type: "bool",
					description: "Enable custom Twitch emoticons hosted on the FrankerFaceZ service",
					notice: "Only affects new messages",
					requires: ["enableTwitch"]
				},
				{
					name: "enableFfzGlobalEmoticons",
					readableName: "Enable FrankerFaceZ global emoticons",
					type: "bool",
					description: "Enable FrankerFaceZ emoticons that apply to all channels",
					notice: "Only affects new messages",
					requires: ["enableTwitch", "enableFfzEmoticons"]
				},
				{
					name: "enableFfzChannelEmoticons",
					readableName: "Enable FrankerFaceZ channel emoticons",
					type: "bool",
					description: "Enable FrankerFaceZ emoticons that apply to specific channels only",
					notice: "Only affects new messages",
					requires: ["enableTwitch", "enableFfzEmoticons"]
				},
				{
					name: "enableBttvEmoticons",
					readableName: "Enable BTTV emoticons",
					type: "bool",
					description: "Enable custom Twitch emoticons hosted on the BTTV service",
					notice: "Only affects new messages",
					requires: ["enableTwitch"]
				},
				{
					name: "enableBttvGlobalEmoticons",
					readableName: "Enable BTTV global emoticons",
					type: "bool",
					description: "Enable BTTV emoticons that apply to all channels",
					notice: "Only affects new messages",
					requires: ["enableTwitch", "enableBttvEmoticons"]
				},
				{
					name: "enableBttvChannelEmoticons",
					readableName: "Enable BTTV channel emoticons",
					type: "bool",
					description: "Enable BTTV emoticons that apply to specific channels only",
					notice: "Only affects new messages",
					requires: ["enableTwitch", "enableBttvEmoticons"]
				},
				{
					name: "enableBttvAnimatedEmoticons",
					readableName: "Enable BTTV animated emoticons",
					type: "bool",
					description: "Enable BTTV emoticons that are animated",
					notice: "Only affects new messages",
					requires: ["enableTwitch", "enableBttvEmoticons"]
				}/*,
				{
					name: "enableBttvPersonalEmoticons",
					readableName: "Enable BTTV personal emoticons (WIP)",
					type: "bool",
					description: "Enable BTTV emoticons that apply to specific people only",
					notice: "Only affects new messages",
					requires: ["enableTwitch", "enableBttvEmoticons"]
				}*/
			],
			"Debug": [
				{
					name: "debug",
					readableName: "Debug mode (developers only)",
					type: "bool",
					description: "Display extra information in the console"
				}
			]
		};

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

		io.setAppConfigValue(name, value);
	}

	renderSetting(setting) {
		let { appConfig, systemInfo } = this.props;
		let { description, name, notice, readableName, requires, type } = setting;

		var prefixInput = null, mainInput = null, isDisabled = false;

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

			default:
				mainInput = <input
					type={type}
					id={name}
					defaultValue={appConfig[name] || ""}
					onChange={changeHandler.string}
					disabled={isDisabled}
					key="input" />;
		}

		// Class name
		const className = "settings__setting" +
			(isDisabled ? " settings__setting--disabled" : "");

		// Output

		if (prefixInput) {
			prefixInput = [prefixInput, " "];
		}

		var suffix = null;

		if (name === "logLinesDb" && systemInfo.databaseSize) {
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
				<a href="https://en.wikipedia.org/wiki/Access_key"
					target="_blank">access key</a>,
				" D"
			];
		}

		return (
			<div className={className} key={name}>
				<h3>
					{ prefixInput }
					<label htmlFor={name}>{ readableName }</label>
				</h3>
				{ mainInput }
				{ description ? <p>{ description }</p> : null }
				{ notice ? <p><em>{ notice }</em></p> : null }
				{ suffix }
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

		return (
			<div key="main">
				{ content }
				<div className="settings__section" key="info">
					<p><em>Pyramid <VersionNumber verbose /></em></p>
				</div>
			</div>
		);
	}
}

SettingsGeneralView.propTypes = {
	appConfig: PropTypes.object,
	systemInfo: PropTypes.object
};

export default connect(({
	appConfig,
	systemInfo
}) => ({
	appConfig,
	systemInfo
}))(SettingsGeneralView);
