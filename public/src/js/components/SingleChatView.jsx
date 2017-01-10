import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";

import { channelUrlFromNames } from "../lib/channelNames";

class SingleChatView extends Component {

	renderLine(msg) {
		if (msg) {
			return (
				<li className="msg" key={msg.id}>
					<span className="msg__channel">{ msg.channelName }</span>{" "}
					<time dateTime={ msg.time }>{ msg.time }</time>{" "}
					<strong className="msg__author">{ msg.username }</strong>{" "}
					<span>{ msg.message }</span>
				</li>
			);
		}

		return null;
	}

	render() {
		const { messages } = this.props;

		if (!messages || !messages.length) {
			return (
				<div id="chatview" className="chatview">
					No data :(
				</div>
			);
		}

		const lines = messages.map(this.renderLine);

		return (
			<div id="chatview" className="chatview">
				<ul>
					{ lines }
				</ul>
			</div>
		);
	}
}

SingleChatView.propTypes = {
	messages: PropTypes.array
}

export default SingleChatView;
