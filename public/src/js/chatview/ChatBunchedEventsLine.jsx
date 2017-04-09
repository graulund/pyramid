import React, { PureComponent, PropTypes } from "react";

import UserLink from "../components/UserLink.jsx";
import { humanDateStamp, timeStamp } from "../lib/formatting";

const PART_EVENT_TYPES = ["part", "quit", "kick", "kill"];
const MAX_USERNAMES = 5;
const MAX_TIME_DIFFERENCE_MS = 15*60*1000;

class ChatUserEventLine extends PureComponent {
	constructor(props) {
		super(props);

		this.expandable = false;
		this.flipState = this.flipState.bind(this);

		this.state = {
			expanded: false
		};
	}

	flipState() {
		if (this.expandable) {
			this.setState({ expanded: !this.state.expanded });
		}
	}

	render() {

		const { events } = this.props;
		const { expanded } = this.state;

		var joins = [], parts = [], eventOrder = [], earliestTime, latestTime;

		events.forEach((event) => {
			if (event) {
				const eventName = event.type === "join" ? "join" : "part";
				if (event.type === "join") {
					joins.push(event.username);
				}
				else if (PART_EVENT_TYPES.indexOf(event.type) >= 0) {
					parts.push(event.username);
				}
				else {
					return;
				}

				if (eventOrder.indexOf(eventName) < 0) {
					eventOrder.push(eventName);
				}

				if (!earliestTime || event.time < earliestTime) {
					earliestTime = event.time;
				}

				if (!latestTime || event.time > latestTime) {
					latestTime = event.time;
				}
			}
		});

		this.expandable = joins.length > MAX_USERNAMES || parts.length > MAX_USERNAMES;

		var content = [];

		eventOrder.forEach((category) => {
			var usernames, eventname;
			if (category === "join") {
				eventname = "joined";
				usernames = joins;
			}
			else if (category === "part") {
				eventname = "left";
				usernames = parts;
			}
			if (eventname && usernames && usernames.length) {

				if (content.length) {
					content.push(", ");
				}

				if (usernames.length > MAX_USERNAMES && !expanded) {
					content.push(
						<strong title={usernames.join(", ")} key={category}>
							{ `${usernames.length} people` }
						</strong>
					);
				}
				else {
					const length = usernames.length;
					usernames.forEach((username, index) => {
						if (index > 0 && index === length - 1) {
							content.push(" and ");
						}
						else if (index > 0) {
							content.push(", ");
						}
						content.push(
							<strong key={`${category}-${index}`}>
								<UserLink userName={username} key={username} />
							</strong>
						);
					});
				}

				content.push(" " + eventname);
			}
		});

		// Time difference

		earliestTime = earliestTime ? new Date(earliestTime) : null;
		latestTime = latestTime ? new Date(latestTime) : null;

		var title = "";

		// Be more explicit with the time difference if enough time passed

		if (earliestTime) {
			const earliestTimeStamp = timeStamp(earliestTime);

			if (latestTime && latestTime - earliestTime >= MAX_TIME_DIFFERENCE_MS) {
				const earliestTimeStampDate = humanDateStamp(earliestTime);
				const latestTimeStampDate = humanDateStamp(latestTime);

				if (earliestTimeStampDate !== latestTimeStampDate) {
					content.push(
						` since ${earliestTimeStampDate} ${earliestTimeStamp}`
					);
				} else {
					content.push(
						` since ${earliestTimeStamp}`
					);
				}

			} else {
				title = `Since ${earliestTimeStamp}`;
			}
		}

		const className = "bunchedevents" +
			(this.expandable ? " bunchedevents--expandable" : "");

		return (
			<span className={className}
				title={title}
				onClick={this.flipState}>
				{ content }
			</span>
		);
	}
}

ChatUserEventLine.propTypes = {
	argument: PropTypes.string,
	by: PropTypes.string,
	channel: PropTypes.string,
	channelName: PropTypes.string,
	events: PropTypes.array,
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	highlight: PropTypes.array,
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
