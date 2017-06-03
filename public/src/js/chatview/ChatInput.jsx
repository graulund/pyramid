import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import escapeRegExp from "lodash/escapeRegExp";
import forOwn from "lodash/forOwn";

import { convertCodesToEmojis } from "../lib/emojis";
import { cacheItem, sendMessage } from "../lib/io";
import { combinedDisplayName } from "../lib/pageTitles";
import { refElSetter } from "../lib/refEls";

const YOUNG_MESSAGE_MS = 1800000;

const TAB_COMPLETE_INITIAL_SUFFIX = ", ";
const TAB_COMPLETE_DEFAULT_SUFFIX = " ";

const TAB_COMPLETE_CLEAN_REGEX = new RegExp(
	"(" + escapeRegExp(TAB_COMPLETE_INITIAL_SUFFIX) + "|" +
	escapeRegExp(TAB_COMPLETE_DEFAULT_SUFFIX) + ")$"
);

const TWITCH_CHANNEL_FLAGS_LABELS = {
	"emote-only": "emote",
	"followers-only": "follow",
	"r9k": "r9k",
	"slow": "slow",
	"subs-only": "sub"
};

const isModifiedEvent = (evt) =>
	!!(evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey);

const isBlockingModifiedEvent = (evt) =>
	!!(evt.metaKey || evt.altKey || evt.ctrlKey);

const getEventDisplayName = function(evt) {
	return evt.displayName || evt.tags && evt.tags["display-name"];
};

const getCombinedDisplayNames = function(list) {
	return list.map(
		({ displayName, username }) =>
		({
			displayName,
			username,
			outName: combinedDisplayName(username, displayName)
		})
	);
};

const matchesSubstring = function(value, subString) {
	return value.slice(0, subString.length).toLowerCase() === subString;
};

var inputHistory = {}, currentInput = "", currentHistoryIndex = -1;

class ChatInput extends PureComponent {

	constructor(props) {
		super(props);

		this.focus = this.focus.bind(this);
		this.onBodyKey = this.onBodyKey.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.submit = this.submit.bind(this);

		this.currentCyclingNames = null;
		this.currentCyclingOffset = 0;

		this.els = {};
		this.setInputEl = refElSetter("input").bind(this);
	}

	shouldComponentUpdate(newProps) {
		// Only the following props are relevant to the view
		if (
			newProps.channel !== this.props.channel ||
			newProps.channelData !== this.props.channelData ||
			newProps.enableTwitch !== this.props.enableTwitch
		) {
			return true;
		}

		return false;
	}

	componentWillReceiveProps(newProps) {
		if (newProps && newProps.channel !== this.props.channel) {
			this.resetCurrentHistory();
		}
	}

	componentDidMount() {
		window.addEventListener("focus", this.focus);
		document.body.addEventListener("keypress", this.onBodyKey);
	}

	componentDidUpdate() {
		this.focus();
	}

	componentWillUnmount() {
		window.removeEventListener("focus", this.focus);
		document.body.removeEventListener("keypress", this.onBodyKey);
	}

	currentUserNames() {
		let { channelCache, channelUserList } = this.props;
		var users = [], userNames = [], displayNames = [];

		// Add most recently talking people first
		if (
			channelCache &&
			channelCache.cache &&
			channelCache.cache.length
		) {
			let now = Date.now();
			let reversedCache = [...channelCache.cache].reverse();
			reversedCache.forEach((evt) => {
				if (evt && evt.username && evt.time) {
					if (
						now - new Date(evt.time) <= YOUNG_MESSAGE_MS &&
						userNames.indexOf(evt.username) < 0
					) {
						users.push({
							displayName: getEventDisplayName(evt),
							username: evt.username
						});
						userNames.push(evt.username);
					}
				}
			});
		}

		displayNames = getCombinedDisplayNames(users);

		// Append from user list those that aren't already there
		if (channelUserList) {
			let listUsers = Object.keys(channelUserList)
				.filter((username) => userNames.indexOf(username) < 0)
				.map((username) =>
					({
						displayName: channelUserList[username].displayName,
						username
					})
				);

			let listDisplayNames = getCombinedDisplayNames(listUsers);
			listDisplayNames.sort((a, b) => {
				return a.outName.toLowerCase().localeCompare(b.outName.toLowerCase());
			});

			displayNames = displayNames.concat(listDisplayNames);
		}

		return displayNames;
	}

	focus() {
		const { isTouchDevice } = this.props;
		const { input: inputEl } = this.els;

		if (inputEl && !isTouchDevice) {
			inputEl.focus();
		}
	}

	handleHistoryKey(direction, origHistory) {
		const { input: inputEl } = this.els;

		var next;

		const history = currentInput
			? [ ...origHistory, currentInput ]
			: origHistory;

		if (direction === "back") {
			if (currentHistoryIndex < 0) {
				next = origHistory.length - 1;
			}
			else if (currentHistoryIndex === 0) {
				next = -1;
			}
			else {
				next = currentHistoryIndex - 1;
			}
		}
		else if (currentHistoryIndex >= 0) {
			if (currentHistoryIndex === origHistory.length - 1) {
				next = -1;
			}
			else {
				next = (currentHistoryIndex + 1);
			}
		}

		if (typeof next === "number") {
			currentHistoryIndex = next >= origHistory.length ? -1 : next;
			if (next < 0) {
				inputEl.value = currentInput || "";
			}
			else {
				inputEl.value = history[next] || "";
			}
		}
	}

	handleTabKey(tokens) {
		const { input: inputEl } = this.els;

		const last = tokens.length-1;
		const suffix = last === 0
			? TAB_COMPLETE_INITIAL_SUFFIX
			: TAB_COMPLETE_DEFAULT_SUFFIX;

		if (!this.currentCyclingNames) {

			// Initiate the list of names we're currently cycling over
			const currentNames = this.currentUserNames();
			const lastToken = tokens[last].toLowerCase();

			const matchingNames = currentNames
				.filter((data) => {
					return matchesSubstring(data.username, lastToken) ||
						(
							data.displayName &&
							matchesSubstring(data.displayName, lastToken)
						);
				})
				.map((data) => data.outName);

			this.currentCyclingNames = matchingNames.length ? matchingNames : null;
			this.currentCyclingOffset = 0;

		} else {

			// Bump offset
			this.currentCyclingOffset =
				(this.currentCyclingOffset + 1) %
					this.currentCyclingNames.length;
		}

		if (this.currentCyclingNames) {
			tokens[last] =
				this.currentCyclingNames[this.currentCyclingOffset] +
				suffix;
			inputEl.value = tokens.join("");
			this.resetCurrentHistory();
		}
	}

	onBodyKey(evt) {

		// Ensure focus if we are typing characters without having focus in the input field

		const { input: inputEl } = this.els;

		if (
			inputEl &&
			evt &&
			evt.target === document.body &&
			evt.key &&
			evt.key.length === 1 &&
			!isBlockingModifiedEvent(evt)
		) {
			// (Apparently this isn't needed?)
			//inputEl.value = inputEl.value + evt.key;

			this.focus();
		}
	}

	onChange() {
		this.resetCurrentHistory();

		const { enableEmojiCodes } = this.props;
		const { input: inputEl } = this.els;
		if (inputEl && inputEl.value && enableEmojiCodes) {
			const val = inputEl.value;
			const convertedValue = convertCodesToEmojis(val, true);
			const { matchIndex, replacementLength, result } = convertedValue;
			if (result !== val) {
				// Set the cursor to the end of the added emoji
				const position = matchIndex + replacementLength;

				inputEl.value = result;
				inputEl.setSelectionRange(position, position);
			}
		}
	}

	onKeyDown(evt) {
		const { channel } = this.props;
		const { input: inputEl } = this.els;

		// Note: These things are in the keydown event because they are not acting
		// correctly when they are in keyup.

		if (
			channel &&
			inputEl &&
			evt &&
			evt.nativeEvent
		) {
			const val = inputEl.value;
			const nevt = evt.nativeEvent;

			if (!isModifiedEvent(nevt)) {

				// Tab complete handling

				if (nevt.keyCode === 9 && val) {
					evt.preventDefault();
					const tokens = val
						.replace(TAB_COMPLETE_CLEAN_REGEX, "")
						.split(/\b/);

					if (tokens && tokens.length) {
						this.handleTabKey(tokens);
						return;
					}
				}

				// Arrow up-down history handling

				else if (nevt.keyCode === 38 || nevt.keyCode === 40) {
					const direction = nevt.keyCode === 38 ? "back" : "forward";
					const origHistory = inputHistory[channel];

					if (origHistory && origHistory.length) {
						evt.preventDefault();
						this.handleHistoryKey(direction, origHistory);
					}
				}
			}
		}

		// Tab key reset

		this.currentCyclingNames = null;
		this.currentCyclingOffset = 0;
	}

	onKeyUp(evt) {
		const { channel } = this.props;
		const { input: inputEl } = this.els;

		if (
			channel &&
			inputEl &&
			evt &&
			evt.nativeEvent
		) {
			const nevt = evt.nativeEvent;
			if (nevt.keyCode === 13) {
				if (
					!isModifiedEvent(nevt) &&
					inputEl.value
				) {
					this.submit();
				}
			}
		}
	}

	resetCurrentHistory() {
		// Call if the contents of the field has been edited

		const { input: inputEl } = this.els;

		currentInput = inputEl && inputEl.value || "";
		currentHistoryIndex = -1;
	}

	submit(evt) {
		const { channel } = this.props;
		const { input: inputEl } = this.els;

		if (evt) {
			evt.preventDefault();
		}

		if (channel && inputEl) {
			const message = inputEl.value;

			// Clean up
			inputEl.value = "";
			this.resetCurrentHistory();

			// Send and store
			sendMessage(channel, message);
			inputHistory[channel] = cacheItem(
				inputHistory[channel] || [],
				message
			);
		}
	}

	renderTwitchChannelFlags() {
		let { channelData } = this.props;

		if (channelData) {

			let flags = [], added = false;

			forOwn(TWITCH_CHANNEL_FLAGS_LABELS, (label, prop) => {
				let value = parseInt(channelData[prop], 10);
				if (value && !isNaN(value)) {
					var tooltip = "";

					if (prop === "slow") {
						tooltip = `${value} seconds`;
					}
					else if (prop === "followers-only") {
						tooltip = `${value} minutes`;
					}

					flags.push({ label, tooltip });
					added = true;
				}
			});

			if (added) {
				return (
					<ul className="chatview__channel-flags" key="flags">
						{ flags.map(({ label, tooltip }) => (
							<li
								key={label}
								title={tooltip}>
								{ label }
							</li>
						)) }
					</ul>
				);
			}
		}

		return null;
	}

	render() {
		let { enableTwitch } = this.props;
		var channelFlags = null;

		if (enableTwitch) {
			channelFlags = this.renderTwitchChannelFlags();
		}

		return (
			<form onSubmit={this.submit} className="chatview__input" key="main">
				<input
					type="text"
					ref={this.setInputEl}
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					tabIndex={1}
					placeholder="Send a message"
					autoComplete="off"
					/>
				<input type="submit" />
				{ channelFlags }
			</form>
		);
	}
}

ChatInput.propTypes = {
	channel: PropTypes.string,
	channelCache: PropTypes.object,
	channelData: PropTypes.object,
	channelUserList: PropTypes.object,
	enableEmojiCodes: PropTypes.bool,
	enableTwitch: PropTypes.bool,
	isTouchDevice: PropTypes.bool
};

const mapStateToProps = function(state, ownProps) {
	let { channel } = ownProps;
	let { channelCaches, channelData, channelUserLists } = state;

	var channelCache, channelUserList, thisChannelData;

	if (channel) {
		channelCache = channelCaches[channel];
		channelUserList = channelUserLists[channel];
		thisChannelData = channelData[channel];
	}

	return {
		channelCache,
		channelData: thisChannelData,
		channelUserList,
		enableEmojiCodes: state.appConfig.enableEmojiCodes,
		enableTwitch: state.appConfig.enableTwitch,
		isTouchDevice: state.deviceState.isTouchDevice
	};
};

export default connect(mapStateToProps)(ChatInput);
