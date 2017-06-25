import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import UserLink from "../../components/UserLink.jsx";
import { getTwitchUserDisplayNameString } from "../../lib/displayNames";
import { humanDateStamp, timeStamp } from "../../lib/formatting";

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
			enableTwitchUserDisplayNames,
			eventOrder = [],
			joinCount,
			joins = [],
			overloaded,
			partCount,
			parts = [],
			server
		} = this.props;

		var {
			earliestTime,
			latestTime,
		} = this.props;

		const { expanded } = this.state;

		this.expandable = joins.length > MAX_USERNAMES || parts.length > MAX_USERNAMES;

		var content = [];

		eventOrder.forEach((category) => {
			var users, eventname, count;
			if (category === "join") {
				eventname = "joined";
				users = joins;
				count = overloaded ? joinCount : joins.length;
			}
			else if (category === "part") {
				eventname = "left";
				users = parts;
				count = overloaded ? partCount : parts.length;
			}
			if (eventname && users && users.length) {

				if (content.length) {
					content.push(", ");
				}

				if (users.length > MAX_USERNAMES && !expanded) {
					let usernames = users.map(
						({ displayName, username }) =>
							getTwitchUserDisplayNameString(
								username,
								displayName,
								enableTwitchUserDisplayNames
							)
					);

					content.push(
						<strong title={usernames.join(", ")} key={category}>
							{ count } people
						</strong>
					);
				}
				else {
					const length = users.length;
					users.forEach((user, index) => {
						let { displayName, username } = user;

						if (index > 0 && index === length - 1) {
							content.push(" and ");
						}
						else if (index > 0) {
							content.push(", ");
						}

						content.push(
							<strong key={`${category}-${index}`}>
								<UserLink
									username={username}
									displayName={displayName}
									serverName={server}
									key={username} />
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
	earliestTime: PropTypes.string.isRequired,
	enableTwitchUserDisplayNames: PropTypes.number,
	eventOrder: PropTypes.array.isRequired,
	events: PropTypes.array.isRequired,
	highlight: PropTypes.array,
	joinCount: PropTypes.number,
	joins: PropTypes.array.isRequired,
	latestTime: PropTypes.string.isRequired,
	lineId: PropTypes.string,
	message: PropTypes.string,
	mode: PropTypes.string,
	overloaded: PropTypes.bool.isRequired,
	partCount: PropTypes.number,
	parts: PropTypes.array.isRequired,
	reason: PropTypes.string,
	server: PropTypes.string,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default connect(({
	appConfig: { enableTwitchUserDisplayNames }
}) => ({
	enableTwitchUserDisplayNames
}))(ChatBunchedEventsLine);

