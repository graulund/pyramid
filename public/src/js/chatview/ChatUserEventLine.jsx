import React, { PureComponent, PropTypes } from "react";

import UserLink from "../components/UserLink.jsx";

class ChatUserEventLine extends PureComponent {
	render() {
		const {
			argument, by, displayUsername, mode, reason, type, username
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
			case "+mode":
				eventDescription = "sets mode: +" + mode +
					(argument ? " " + argument : "");
				break;
			case "-mode":
				eventDescription = "sets mode: -" + mode +
					(argument ? " " + argument : "");
				break;
		}

		const className = "userevent" +
			(isStrong ? " userevent--strong" : "");

		return (
			<span className={className}>
				{ displayUsername
					? (
						<strong className="userevent__target">
							<UserLink userName={username} key={username} />
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
	displayUsername: PropTypes.bool,
	highlight: PropTypes.array,
	isAction: PropTypes.bool,
	lineId: PropTypes.string,
	message: PropTypes.string,
	mode: PropTypes.string,
	reason: PropTypes.string,
	server: PropTypes.string,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatUserEventLine;
