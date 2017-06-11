import React from "react";

import SettingsAppConfigView from "./SettingsAppConfigView.jsx";
import VersionNumber from "../components/VersionNumber.jsx";
import { timeZoneFormattedList } from "../lib/timeZones";

const settings = {
	"Web server": [
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

	"Notifications": [
		{
			name: "enableDesktopNotifications",
			readableName: "Desktop notifications",
			type: "bool",
			description: "Enable notifications in your browser whenever someone highlights you in chat",
			notice: "You still need to grant notification privileges in your browser for these to show up"
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
		},
		{
			name: "cacheLines",
			readableName: "Live scrollback length",
			type: "number",
			description: "Number of lines you can see in a live chat view",
			notice: "Must be between 20 and 500. Default value is 150"
		}
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

export default function SettingsGeneralView() {
	return (
		<div key="main">
			<SettingsAppConfigView
				useSystemInfo
				settings={settings}
				key="config" />
			<div className="settings__section" key="info">
				<p><em>Pyramid <VersionNumber verbose /></em></p>
			</div>
		</div>
	);
}
