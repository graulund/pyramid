import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChatUsername from "./ChatUsername.jsx";
import TwitchEmoticon from "../twitch/TwitchEmoticon.jsx";
import { isTwitch } from "../lib/ircConfigs";
import { TOKEN_TYPES, tokenizeChatLine } from "../lib/tokenizer";

class ChatMessageLine extends PureComponent {

	renderText(token) {
		return token.text;
	}

	renderLink(token, index) {
		return (
			<a
			target="_blank"
			href={token.url}
			key={index}>
				{ token.text }
			</a>
		);
	}

	renderMention(token, index) {
		return <mark key={index}>{ token.text }</mark>;
	}

	renderEmoji(token, index) {
		// TODO: Render emoji as image if needed
		return (
			<span
				className="emoji"
				data-codepoints={token.codepoints}
				key={index}>
				{ token.text }
			</span>
		);
	}

	renderTwitchEmoticon(token, index) {
		const { enable3xEmotes } = this.props;
		return <TwitchEmoticon
			{...token.emote}
			text={token.text}
			enable3xEmotes={enable3xEmotes}
			key={index} />;
	}

	renderToken(token, index) {
		switch(token.type) {
			case TOKEN_TYPES.TEXT:
				return this.renderText(token, index);
			case TOKEN_TYPES.LINK:
				return this.renderLink(token, index);
			case TOKEN_TYPES.MENTION:
				return this.renderMention(token, index);
			case TOKEN_TYPES.EMOJI:
				return this.renderEmoji(token, index);
			case TOKEN_TYPES.TWITCH_EMOTICON:
				return this.renderTwitchEmoticon(token, index);
		}

		console.warn(
			`Encountered unsupported line token type \`${token.type}\``
		);
		return null;
	}

	render() {
		const {
			color, displayUsername, enableTwitch, enableTwitchColors,
			enableUsernameColors, ircConfigs, server, symbol = "",
			tags, type, username
		} = this.props;

		const className = "msg" +
			(type !== "msg" ? ` msg--${type}` : "");

		const useTwitch = enableTwitch && server &&
			ircConfigs && isTwitch(ircConfigs[server]);

		const tokens = tokenizeChatLine(this.props, useTwitch);

		const messageContent = tokens.map(
			(token, index) => this.renderToken(token, index)
		);

		var authorClassName = "msg__author";
		var authorColor = null;
		var authorDisplayName = null;
		var authorUserId = null;

		// Number color
		if (enableUsernameColors && typeof color === "number" && color >= 0) {
			authorColor = color;
		}

		// Twitch color
		if (enableTwitchColors && tags && tags.color) {
			authorColor = tags.color;
		}

		// Twitch display name
		if (tags && tags["display-name"]) {
			authorDisplayName = tags["display-name"];
		}

		if (tags && tags["user-id"]) {
			authorUserId = tags["user-id"];
		}

		const content = (
			<span className={className} data-user-id={authorUserId} key="main">
				{ username && displayUsername
					? [
						<ChatUsername
							className={authorClassName}
							color={authorColor}
							displayName={authorDisplayName}
							symbol={symbol}
							username={username}
							key="username" />,
						" "
					] : null }
				{ messageContent }
			</span>
		);

		return content;
	}
}

ChatMessageLine.propTypes = {
	channel: PropTypes.string,
	channelName: PropTypes.string,
	color: PropTypes.number,
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	enable3xEmotes: PropTypes.bool,
	enableTwitch: PropTypes.bool,
	enableTwitchColors: PropTypes.bool,
	enableTwitchDisplayNames: PropTypes.bool,
	enableUsernameColors: PropTypes.bool,
	highlight: PropTypes.array,
	ircConfigs: PropTypes.object,
	lineId: PropTypes.string,
	message: PropTypes.string,
	observer: PropTypes.object,
	server: PropTypes.string,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default connect(({
	appConfig: {
		enable3xEmotes,
		enableTwitch,
		enableTwitchColors,
		enableUsernameColors
	},
	ircConfigs
}) => ({
	enable3xEmotes,
	enableTwitch,
	enableTwitchColors,
	enableUsernameColors,
	ircConfigs
}))(ChatMessageLine);
