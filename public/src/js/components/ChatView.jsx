import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";
import moment from "moment";

import ChannelName from "./ChannelName.jsx";
import ChatLines from "./ChatLines.jsx";
import { channelUrlFromNames } from "../lib/channelNames";
import { sendMessage, subscribeToChannel, unsubscribeFromChannel, subscribeToUser, unsubscribeFromUser } from "../lib/io";
import { stickToTheBottom } from "../lib/visualBehavior";
import { CACHE_LINES } from "../constants";

class ChatView extends Component {
	constructor(props) {
		super(props);
		const { params } = this.props;

		this.onClick = this.onClick.bind(this);
		this.onKey = this.onKey.bind(this);
		this.submit = this.submit.bind(this);

		this.lines = null;
		this.channelUrl = params.channelName && params.serverName
			? channelUrlFromNames(params.serverName, params.channelName) : null;
		this.requestSubscription(params);
	}

	componentDidMount () {
		const { params } = this.props;
		console.log("ChatView opened with params:", params);
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
				this.requestSubscription(newParams);
				this.requestUnsubscription(currentParams);
				return true;
			}

			// Lines change
			if (this.lines != newLines) {
				this.lines = newLines;
				return true;
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

	onClick(evt) {
		console.log("Clicked in chat view", evt, evt.nativeEvent);
	}

	onKey(evt) {
		const { input: inputEl } = this.refs;
		if (
			this.channelUrl &&
			inputEl &&
			evt &&
			evt.nativeEvent &&
			evt.nativeEvent.keyCode === 13
		) {
			this.submit();
		}
	}

	submit(evt) {
		const { input: inputEl } = this.refs;

		if (evt) {
			evt.preventDefault();
		}

		if (
			this.channelUrl &&
			inputEl
		) {
			const message = inputEl.value;
			inputEl.value = "";
			sendMessage(this.channelUrl, message);
		}
	}

	requestSubscription(params) {
		const { channelName, serverName, userName } = params;
		if (channelName && serverName) {
			subscribeToChannel(channelUrlFromNames(serverName, channelName));
		}
		else if (userName) {
			subscribeToUser(userName);
		}
	}

	requestUnsubscription(params) {
		const { channelName, serverName, userName } = params;
		if (channelName && serverName) {
			unsubscribeFromChannel(channelUrlFromNames(serverName, channelName));
		}
		else if (userName) {
			unsubscribeFromUser(userName);
		}
	}

	render() {
		const messages = this.lines;
		const { params } = this.props;

		const head = this.channelUrl
			? <ChannelName channel={this.channelUrl} key={this.channelUrl} />
			: params.userName;

		const contentParams = {
			displayChannel:  !this.channelUrl,
			displayUsername: !!this.channelUrl,
			messages
		};

		const content = <ChatLines {...contentParams} key="main" />;

		const className = "chatview" +
			(this.channelUrl ? " chatview--channel" : "");

		return (
			<div id="chatview" className={className} onClick={this.onClick}>
				<h2>{ head }</h2>
				{ content }
				{ this.channelUrl
					? (
						<form onSubmit={this.submit} className="chatview__input">
							<input onKeyUp={this.onKey} type="text" ref="input" placeholder="Send a message" tabIndex={0} />
							<input type="submit" />
						</form>
					)
					: null }
			</div>
		);
	}
}

ChatView.propTypes = {
	channelCaches: PropTypes.object,
	params: PropTypes.object,
	userCaches: PropTypes.object
};

export default connect(
	({ channelCaches, userCaches }) => ({ channelCaches, userCaches })
)(ChatView);
