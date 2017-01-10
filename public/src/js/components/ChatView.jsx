import React, { Component, PropTypes } from "react";
import { render } from "react-dom";
import { connect } from "react-redux";
import moment from "moment";

import ChannelName from "./ChannelName.jsx";
import SingleChatView from "./SingleChatView.jsx";
import { channelUrlFromNames } from "../lib/channelNames";
import { sendMessage } from "../lib/io";
import { stickToTheBottom } from "../lib/visualBehavior";
import { CACHE_LINES } from "../constants";

class ChatView extends Component {
	componentDidMount () {
		const { params } = this.props;
		console.log("ChatView opened with params:", params);

		this.onKey = this.onKey.bind(this);
		this.renderLine = this.renderLine.bind(this);

		this.lines = null;
		this.lastRenderedMessageId = null;
		this.rendered = false;
		this.channelUrl = params.channelName && params.serverName
			? channelUrlFromNames(params.serverName, params.channelName) : null;
	}

	componentDidUpdate () {
		stickToTheBottom();
	}

	shouldComponentUpdate (newProps) {
		if (newProps) {
			const { params: currentParams } = this.props;
			const { params: newParams } = newProps;
			const newLines = this.getLines(newProps);

			// Channel change
			if (
				currentParams.userName != newParams.userName ||
				currentParams.channelName != newParams.channelName ||
				currentParams.serverName != newParams.serverName
			) {
				console.log("ChatView received new params:", newParams);
				this.channelUrl = newParams.channelName && newParams.serverName
					? channelUrlFromNames(newParams.serverName, newParams.channelName) : null;
				return true;
			}

			// Lines change
			if (this.lines != newLines) {
				this.lines = newLines;

				//if (!this.rendered) {
					return true;
				/*}

				this.manuallyRenderNewLines();
				return false; */
			}
		}

		return false;
	}

	getLines (props = this.props) {
		const { channelCaches, params, userCaches } = props;

		if (params.channelName && params.serverName) {
			return channelCaches[channelUrlFromNames(params.serverName, params.channelName)];
		}
		else if (params.userName) {
			return userCaches[params.userName];
		}

		return null;
	}

	/* lastMessageIdInList (lines) {
		const lastLine = lines[lines.length-1];
		return lastLine ? lastLine.id : null;
	}

	manuallyRenderNewLines () {
		const listEl = this.refs.list;
		const lines = this.lines;
		const lastId = this.lastMessageIdInList(lines);
		if (lastId != this.lastRenderedMessageId) {
			var lastAddedEl = null;
			for(var i = lines.length-1; i >= 0; i--) {
				const msg = lines[i];

				if (msg) {
					if (msg.id == this.lastRenderedMessageId) {
						break;
					}

					var test = document.createElement("li");

					var el = this.renderLine(msg);
					render(el, test);
					el = test;

					if (lastAddedEl) {
						listEl.insertBefore(el, lastAddedEl);
						console.log("Inserted message before bottom", el);
					} else {
						listEl.appendChild(el);
						console.log("Inserted message at bottom", el);
					}
					lastAddedEl = el;
				}
			}

			this.lastRenderedMessageId = lastId;
		}
	} */

	onKey(evt) {
		const { input: inputEl } = this.refs;
		if (
			this.channelUrl &&
			inputEl &&
			evt &&
			evt.nativeEvent &&
			evt.nativeEvent.keyCode === 13
		) {
			const message = inputEl.value;
			inputEl.value = "";
			sendMessage(this.channelUrl, message);
		}
	}

	renderLine(msg) {
		if (msg) {
			const m = moment(msg.time);
			const timestamp = m.format("H:mm:ss");
			const className = "msg" + (msg.isAction ? " msg--action" : "");
			return (
				<li className={className} key={msg.id}>
					{ !this.channelUrl
						? <span className="msg__channel">{ msg.channelName + " " }</span>
						: null }
					<time dateTime={ msg.time } title={m.format("YYYY-MM-DD") + " " + timestamp}>
						{ timestamp }
					</time>{" "}
					{ this.channelUrl
						? <strong className="msg__author">{ msg.username + " " }</strong>
						: null }
					<span>{ msg.message }</span>
				</li>
			);
		}

		return null;
	}

	render() {
		//const { messages } = this.props;
		const messages = this.lines;
		const { params } = this.props;

		const head = this.channelUrl
			? <ChannelName channel={this.channelUrl} />
			: params.userName;

		if (!messages || !messages.length) {
			this.rendered = false;
			return (
				<div id="chatview" className="chatview">
					<h2>{ head }</h2>
					<div className="chatview__error">No data :(</div>
				</div>
			);
		}

		this.rendered = true;
		//this.lastRenderedMessageId = this.lastMessageIdInList(messages);

		const lines = messages.map(this.renderLine);

		return (
			<div id="chatview" className="chatview">
				<h2>{ head }</h2>
				<ul ref="list">
					{ lines }
				</ul>
				{ this.channelUrl
					? (
						<div className="chatview__input">
							<input onKeyUp={this.onKey} ref="input" placeholder="Send a message" tabIndex={0} />
						</div>
					)
					: null }
			</div>
		);
	}


	/* render() {
		//const { lines } = this.state;
		const lines = this.lines;

		return <SingleChatView messages={lines} />;
	} */
}

ChatView.propTypes = {
	channelCaches: PropTypes.object,
	params: PropTypes.object,
	userCaches: PropTypes.object
};

export default connect(
	({ channelCaches, userCaches }) => ({ channelCaches, userCaches })
)(ChatView);
