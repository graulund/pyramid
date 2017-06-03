import React from "react";

import SettingsAppConfigView from "./SettingsAppConfigView.jsx";

const settings = {
	"Twitch general": [
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
		}
	],

	"FrankerFaceZ": [
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
		}
	],

	"BTTV": [
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
	]
};

export default function SettingsTwitchView() {
	return <SettingsAppConfigView settings={settings} />;
}
