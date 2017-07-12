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
			notice: "Requires server restart",
			min: 1,
			max: 65535
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
			name: "retainDbValue",
			readableName: "How much to retain in the database (value)",
			type: "number",
			description: "Chat lines are kept in a local database for a period of time. You can choose how many or for how long these are kept. The unit for this number is either lines or days, depending on below. (If you type zero, all lines are kept and the database will slowly expand to unlimited size.)",
			notice: "The unit of this value is defined below!",
			min: 0
		},
		{
			name: "retainDbType",
			readableName: "How much to retain in the database (unit)",
			type: "enum",
			description: "Choosing to define how many lines are kept at any time in the database makes the file size of the database more predictable, but it makes the amount of time you can look back less predictable. Choosing days as the unit does the opposite.",
			notice: "The value for this unit is defined above!",
			valueNames: [
				"Lines",
				"Days"
			]
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
			name: "showActivityFlashes",
			readableName: "Show activity flashes in sidebar",
			type: "bool",
			description: "Whenever there's activity in a channel, show a quick flash"
		},
		{
			name: "showUserEvents",
			readableName: "Show user events",
			type: "enum",
			description: "How to handle join and part events",
			notice: "Collapse presence means: If someone joins and immediately leaves, don't display anything for them",
			valueNames: [
				"Off",
				"Collapse presence (default)",
				"Collapse events into one line",
				"Show all"
			]
		},
		{
			name: "cacheLines",
			readableName: "Live scrollback length",
			type: "number",
			description: "Number of lines you can see in a live chat view",
			notice: "Must be between 20 and 500. Default value is 150",
			min: 20,
			max: 500
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
