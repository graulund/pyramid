import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";
import escapeStringRegexp from "escape-string-regexp";

import { sendMessage } from "../lib/io";

const TAB_COMPLETE_INITIAL_SUFFIX = ", ";
const TAB_COMPLETE_DEFAULT_SUFFIX = " ";

const TAB_COMPLETE_CLEAN_REGEX = new RegExp(
	"(" + escapeStringRegexp(TAB_COMPLETE_INITIAL_SUFFIX) + "|" +
	escapeStringRegexp(TAB_COMPLETE_DEFAULT_SUFFIX) + ")$"
);

class ChatInput extends Component {

	constructor(props) {
		super(props);

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.submit = this.submit.bind(this);

		this.currentCyclingNames = null;
		this.currentCyclingOffset = 0;
	}

	shouldComponentUpdate(newProps) {
		if (newProps) {
			if (newProps.channel != this.props.channel) {
				return true;
			}
		}

		return false;
	}

	currentUserNames() {
		const { channel, channelUserLists } = this.props;
		if (channelUserLists[channel]) {
			var userNames = Object.keys(channelUserLists[channel]);
			userNames.sort();
			return userNames;
		}

		// TODO: Consider including the authors of the messages in current channel cache?
		// TODO: Sorting?

		return [];
	}

	onKeyDown(evt) {
		const { channel } = this.props;
		const { input: inputEl } = this.refs;

		if (
			channel &&
			inputEl &&
			inputEl.value &&
			evt &&
			evt.nativeEvent
		) {
			const val = inputEl.value;
			const nevt = evt.nativeEvent;

			// Tab complete handling
			if (
				nevt.keyCode === 9 &&
				!nevt.altKey &&
				!nevt.ctrlKey &&
				!nevt.metaKey &&
				!nevt.shiftKey
			) {
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
					}
					return;
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
			evt.nativeEvent &&
			evt.nativeEvent.keyCode === 13
		) {
			this.submit();
		}
	}

	submit(evt) {
		const { channel } = this.props;
		const { input: inputEl } = this.refs;

		if (evt) {
			evt.preventDefault();
		}

		if (channel && inputEl) {
			const message = inputEl.value;
			inputEl.value = "";
			sendMessage(channel, message);
		}
	}

	render() {
		return (
			<form onSubmit={this.submit} className="chatview__input" key="main">
				<input
					type="text"
					ref="input"
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
	channelUserLists: PropTypes.object,
	channel: PropTypes.string
};

export default connect(({
	channelUserLists
}) => ({
	channelUserLists
}))(ChatInput);
