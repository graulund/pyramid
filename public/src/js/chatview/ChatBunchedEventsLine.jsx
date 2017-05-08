import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import UserLink from "../components/UserLink.jsx";
import { humanDateStamp, timeStamp } from "../lib/formatting";

const MAX_USERNAMES = 5;
const MAX_TIME_DIFFERENCE_MS = 15*60*1000;

class ChatBunchedEventsLine extends PureComponent {
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

		const {
			eventOrder = [],
			joinCount,
			joins = [],
			overloaded,
			partCount,
			parts = []
		} = this.props;

		var {
			earliestTime,
			latestTime,
		} = this.props;

		const { expanded } = this.state;

		this.expandable = joins.length > MAX_USERNAMES || parts.length > MAX_USERNAMES;

		var content = [];

		eventOrder.forEach((category) => {
			var usernames, eventname, count;
			if (category === "join") {
				eventname = "joined";
				usernames = joins;
				count = overloaded ? joinCount : joins.length;
			}
			else if (category === "part") {
				eventname = "left";
				usernames = parts;
				count = overloaded ? partCount : parts.length;
			}
			if (eventname && usernames && usernames.length) {

				if (content.length) {
					content.push(", ");
				}

				if (usernames.length > MAX_USERNAMES && !expanded) {
					content.push(
						<strong title={usernames.join(", ")} key={category}>
							{ count } people
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

		if (!content.length) {
			return null;
		}

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

ChatBunchedEventsLine.propTypes = {
	argument: PropTypes.string,
	by: PropTypes.string,
	channel: PropTypes.string,
	channelName: PropTypes.string,
	collapseJoinParts: PropTypes.bool,
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	earliestTime: PropTypes.string,
	eventOrder: PropTypes.array,
	events: PropTypes.array,
	highlight: PropTypes.array,
	joinCount: PropTypes.number,
	joins: PropTypes.array,
	latestTime: PropTypes.string,
	lineId: PropTypes.string,
	message: PropTypes.string,
	mode: PropTypes.string,
	overloaded: PropTypes.bool,
	partCount: PropTypes.number,
	parts: PropTypes.array,
	reason: PropTypes.string,
	server: PropTypes.string,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatBunchedEventsLine;
