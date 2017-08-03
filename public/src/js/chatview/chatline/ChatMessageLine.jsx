import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChatUsername from "./ChatUsername.jsx";
import Emoji from "./Emoji.jsx";
import TwitchBadges from "../../twitch/TwitchBadges.jsx";
import TwitchCheermote from "../../twitch/TwitchCheermote.jsx";
import TwitchEmoticon from "../../twitch/TwitchEmoticon.jsx";
import { fixColorContrast } from "../../lib/color";
import { parseChannelUri } from "../../lib/channelNames";
import { TOKEN_TYPES, tokenizeChatLine } from "../../lib/tokenizer";

const block = "msg";
class ChatMessageLine extends PureComponent {
	constructor(props) {
		super(props);

		this.unhide = this.unhide.bind(this);

		this.state = {
			unhidden: false
		};
	}

	unhide() {
		this.setState({ unhidden: true });
	}

	renderCleared() {
		return (
			<button
				className="unhide"
				key="unhide"
				onClick={this.unhide}>
				Show deleted message
			</button>
		);
	}

	renderText(token) {
		return token.text;
	}

	renderLink(token, index) {
		return (
			<a
				target="_blank"
				rel="noopener noreferrer"
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
		let {
			enableEmojiCodes,
			enableEmojiImages,
			onEmoteLoad
		} = this.props;

		let { codepoints, name, text } = token;

		return <Emoji
			codepoints={codepoints}
			enableEmojiCodes={enableEmojiCodes}
			enableEmojiImages={enableEmojiImages}
			name={name}
			text={text}
			onLoad={onEmoteLoad}
			key={index} />;
	}

	renderTwitchCheermote(token, index) {
		const { onEmoteLoad } = this.props;
		return <TwitchCheermote
			{...token.emote}
			text={token.text}
			onLoad={onEmoteLoad}
			key={index} />;
	}

	renderTwitchEmoticon(token, index) {
		const { onEmoteLoad } = this.props;
		return <TwitchEmoticon
			{...token.emote}
			text={token.text}
			onLoad={onEmoteLoad}
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
			case TOKEN_TYPES.TWITCH_CHEERMOTE:
				return this.renderTwitchCheermote(token, index);
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
			channel,
			cleared = false,
			color,
			colorBlindness,
			displayUsername,
			enableDarkMode,
			enableTwitchBadges,
			enableTwitchColors,
			enableUsernameColors,
			showTwitchDeletedMessages,
			server,
			symbol = "",
			tags,
			type,
			username,
			useTwitch
		} = this.props;

		const { unhidden } = this.state;

		const tokens = tokenizeChatLine(this.props, useTwitch);

		var className = block +
			(type !== "msg" ? ` ${block}--${type}` : "") +
			(cleared && showTwitchDeletedMessages ? ` ${block}--cleared` : "");

		var messageContent;

		if (useTwitch && cleared && !unhidden && !showTwitchDeletedMessages) {
			messageContent = this.renderCleared();
		}
		else {
			messageContent = tokens.map(
				(token, index) => this.renderToken(token, index)
			);
		}

		var authorClassName = `${block}__author`;
		var authorColor = null;
		var authorDisplayName = null;
		var authorUserId;

		// Number color
		if (enableUsernameColors && typeof color === "number" && color >= 0) {
			authorColor = color;
		}

		var prefix = null;
		var displayedSymbol = symbol;
		var usernameDisplayed = displayUsername;
		var styles;

		if (useTwitch) {

			// Symbols aren't visible
			displayedSymbol = "";

			// Server names aren't visible
			if (username.indexOf(".") >= 0) {
				usernameDisplayed = false;
			}

			// Twitch color
			if (enableTwitchColors && tags && tags.color) {
				let { color } = tags;
				authorColor = color;

				// Extra color on actions
				if (type === "action") {
					let fixedColors = fixColorContrast(color, colorBlindness);
					let fixedColor = enableDarkMode
						? fixedColors.dark : fixedColors.light;
					styles = { color: fixedColor };
					className += ` ${block}--twitch-action`;
				}
			}

			// Twitch display name
			if (tags && tags["display-name"]) {
				authorDisplayName = tags["display-name"];
			}

			// Twitch user id
			if (tags && tags["user-id"]) {
				authorUserId = tags["user-id"];
			}

			// Twitch badges
			if (
				usernameDisplayed &&
				enableTwitchBadges &&
				tags &&
				tags.badges &&
				tags.badges.length
			) {
				prefix = (
					<TwitchBadges
						badges={tags.badges}
						channel={channel}
						server={server}
						key="badges" />
				);
			}
		}

		const content = (
			<span
				className={className}
				data-user-id={authorUserId}
				style={styles}
				key="main">
				{ prefix }
				{ username && usernameDisplayed
					? [
						<ChatUsername
							className={authorClassName}
							color={authorColor}
							colorBlindness={colorBlindness}
							displayName={authorDisplayName}
							enableDarkMode={enableDarkMode}
							serverName={server}
							symbol={displayedSymbol}
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
	cleared: PropTypes.bool,
	color: PropTypes.number,
	colorBlindness: PropTypes.number,
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	enableDarkMode: PropTypes.bool,
	enableEmojiCodes: PropTypes.bool,
	enableEmojiImages: PropTypes.bool,
	enableTwitchBadges: PropTypes.bool,
	enableTwitchColors: PropTypes.bool,
	enableUsernameColors: PropTypes.bool,
	highlight: PropTypes.array,
	ircConfigs: PropTypes.object,
	lineId: PropTypes.string,
	message: PropTypes.string.isRequired,
	observer: PropTypes.object,
	onEmoteLoad: PropTypes.func,
	server: PropTypes.string,
	showTwitchDeletedMessages: PropTypes.bool,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string,
	useTwitch: PropTypes.bool
};

const mapStateToProps = function(state, ownProps) {
	let { channel } = ownProps;
	let { appConfig, serverData } = state;

	let {
		colorBlindness,
		enableDarkMode,
		enableEmojiCodes,
		enableEmojiImages,
		enableTwitch,
		enableTwitchBadges,
		enableTwitchColors,
		enableUsernameColors,
		showTwitchDeletedMessages
	} = appConfig;

	let uriData = parseChannelUri(channel);
	let server = uriData && uriData.server;
	let thisServerData = server && serverData[server];
	let useTwitch = enableTwitch && thisServerData && thisServerData.isTwitch;

	return {
		colorBlindness,
		enableDarkMode,
		enableEmojiCodes,
		enableEmojiImages,
		enableTwitchBadges,
		enableTwitchColors,
		enableUsernameColors,
		showTwitchDeletedMessages,
		useTwitch
	};
};

export default connect(mapStateToProps)(ChatMessageLine);
