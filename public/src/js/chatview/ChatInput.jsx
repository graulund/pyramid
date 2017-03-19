import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";
import escapeRegExp from "lodash/escapeRegExp";
import moment from "moment";

import { convertCodesToEmojis } from "../lib/emojis";
import { cacheItem, sendMessage } from "../lib/io";

const YOUNG_MESSAGE_MS = 1800000;

const TAB_COMPLETE_INITIAL_SUFFIX = ", ";
const TAB_COMPLETE_DEFAULT_SUFFIX = " ";

const TAB_COMPLETE_CLEAN_REGEX = new RegExp(
	"(" + escapeRegExp(TAB_COMPLETE_INITIAL_SUFFIX) + "|" +
	escapeRegExp(TAB_COMPLETE_DEFAULT_SUFFIX) + ")$"
);

var inputHistory = {}, currentInput = "", currentHistoryIndex = -1;

class ChatInput extends Component {

	constructor(props) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.submit = this.submit.bind(this);

		this.currentCyclingNames = null;
		this.currentCyclingOffset = 0;
	}

	shouldComponentUpdate(newProps) {
		if (newProps) {
			if (newProps.channel !== this.props.channel) {
				return true;
			}
		}

		return false;
	}

	componentWillReceiveProps(newProps) {
		if (newProps) {
			if (newProps.channel !== this.props.channel) {
				this.resetCurrentHistory();
			}
		}
	}

	currentUserNames() {
		const { channel, channelCaches, channelUserLists } = this.props;

		var userNames = [];

		// Read from user list
		if (channelUserLists[channel]) {
			userNames = Object.keys(channelUserLists[channel]);
		}

		// Add missing users by reading the cache directly
		if (channelCaches[channel] && channelCaches[channel].length) {
			const now = moment();
			channelCaches[channel].forEach((evt) => {
				if (evt && evt.username && evt.time) {
					if (
						now.diff(evt.time) <= YOUNG_MESSAGE_MS &&
						userNames.indexOf(evt.username) < 0
					) {
						userNames.push(evt.username);
					}
				}
			});
		}

		userNames.sort();
		return userNames;

		// TODO: More clever sorting?
		// * Most recently speaking first?
		// * The ones you talked to more recently first?
	}

	onChange() {
		this.resetCurrentHistory();

		const { enableEmojiCodes } = this.props;
		const { input: inputEl } = this.refs;
		if (inputEl && inputEl.value && enableEmojiCodes) {
			const val = inputEl.value;
			const convertedValue = convertCodesToEmojis(val);
			if (convertedValue !== val) {
				inputEl.value = convertedValue;
			}
		}
	}

	onKeyDown(evt) {
		const { channel } = this.props;
		const { input: inputEl } = this.refs;

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

			if (
				!nevt.altKey &&
				!nevt.ctrlKey &&
				!nevt.metaKey &&
				!nevt.shiftKey
			) {

				// Tab complete handling

				if (nevt.keyCode === 9 && val) {
					evt.preventDefault();
					const tokens = val.replace(TAB_COMPLETE_CLEAN_REGEX, "").split(/\b/);

					if (tokens && tokens.length) {

						const last = tokens.length-1;
						const suffix = last === 0
							? TAB_COMPLETE_INITIAL_SUFFIX
							: TAB_COMPLETE_DEFAULT_SUFFIX;

						if (!this.currentCyclingNames) {

							// Initiate the list of names we're currently cycling over
							const currentNames = this.currentUserNames();
							const lastToken = tokens[last].toLowerCase();

							const matchingNames = currentNames.filter(
								(n) => n.slice(0, lastToken.length).toLowerCase() === lastToken
							);
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
						return;
					}
				}

				// Arrow up-down history handling

				else if (nevt.keyCode === 38 || nevt.keyCode === 40) {
					const direction = nevt.keyCode === 38 ? "back" : "forward";
					const origHistory = inputHistory[channel];
					var next;

					if (origHistory && origHistory.length) {
						evt.preventDefault();

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
				}
			}
		}

		this.currentCyclingNames = null;
		this.currentCyclingOffset = 0;
	}

	onKeyUp(evt) {
		const { channel } = this.props;
		const { input: inputEl } = this.refs;

		if (
			channel &&
			inputEl &&
			evt &&
			evt.nativeEvent
		) {
			const nevt = evt.nativeEvent;
			if (nevt.keyCode === 13) {
				if (
					!nevt.altKey &&
					!nevt.ctrlKey &&
					!nevt.metaKey &&
					!nevt.shiftKey &&
					inputEl.value
				) {
					this.submit();
				}
			}
		}
	}

	resetCurrentHistory() {
		// Call if the contents of the field has been edited

		const { input: inputEl } = this.refs;

		currentInput = inputEl && inputEl.value || "";
		currentHistoryIndex = -1;
	}

	submit(evt) {
		const { channel } = this.props;
		const { input: inputEl } = this.refs;

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

	render() {
		return (
			<form onSubmit={this.submit} className="chatview__input" key="main">
				<input
					type="text"
					ref="input"
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					tabIndex={0}
					placeholder="Send a message"
					/>
				<input type="submit" />
			</form>
		);
	}
}

ChatInput.propTypes = {
	channelCaches: PropTypes.object,
	channelUserLists: PropTypes.object,
	channel: PropTypes.string,
	enableEmojiCodes: PropTypes.bool
};

export default connect(({
	appConfig: { enableEmojiCodes },
	channelCaches,
	channelUserLists
}) => ({
	channelCaches,
	channelUserLists,
	enableEmojiCodes
}))(ChatInput);
