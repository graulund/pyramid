import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import UserLink from "../../components/UserLink.jsx";

const block = "userevent";

class ChatUserEventLine extends PureComponent {
	render() {
		const {
			argument,
			by,
			displayName,
			displayUsername,
			message,
			mode,
			reason,
			server,
			type,
			username
		} = this.props;

		var eventDescription = "";
		var isStrong = false;

		switch (type) {
			case "join":
				eventDescription = "joined";
				break;
			case "part":
				eventDescription = "left" + (reason ? " (" + reason + ")" : "");
				break;
			case "quit":
				eventDescription = "quit" + (reason ? " (" + reason + ")" : "");
				break;
			case "kick":
				isStrong = true;
				eventDescription = "was kicked by " + by +
					(reason ? " (" + reason + ")" : "");
				break;
			case "kill":
				eventDescription = "was killed" +
					(reason ? " (" + reason + ")" : "");
				break;
			case "mode":
				eventDescription = "sets mode: " + mode +
					(argument ? " " + argument : "");
				break;
			case "clearchat":
				eventDescription = message;
				break;
		}

		const className = block +
			(isStrong ? ` ${block}--strong` : "");

		return (
			<span className={className}>
				{ displayUsername
					? (
						<strong className={`${block}__target`}>
							<UserLink
								displayName={displayName}
								serverName={server}
								username={username}
								key={username} />
							{" "}
						</strong>
					) : null }
				<span>
					{ eventDescription }
				</span>
			</span>
		);
	}
}

ChatUserEventLine.propTypes = {
	argument: PropTypes.string,
	by: PropTypes.string,
	channel: PropTypes.string,
	channelName: PropTypes.string,
	displayChannel: PropTypes.bool,
	displayName: PropTypes.string,
	displayUsername: PropTypes.bool,
	highlight: PropTypes.array,
	lineId: PropTypes.string,
	message: PropTypes.string,
	mode: PropTypes.string,
	reason: PropTypes.string,
	server: PropTypes.string,
	time: PropTypes.string,
	type: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired
};

export default ChatUserEventLine;
