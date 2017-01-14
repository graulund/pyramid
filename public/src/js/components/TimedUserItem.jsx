import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";

import ChannelLink from "./ChannelLink.jsx";
import TimedItem from "./TimedItem.jsx";
import UserLink from "./UserLink.jsx";
import { RELATIONSHIP_BEST_FRIEND } from "../constants";

class TimedUserItem extends Component {

	render() {
		const { friendsList, userData, userName } = this.props;

		var classNames = [];

		if (
			friendsList[RELATIONSHIP_BEST_FRIEND] &&
			friendsList[RELATIONSHIP_BEST_FRIEND].indexOf(userName) >= 0
		) {
			classNames.push("bestfriend");
		}

		var className = classNames.join(" ");

		const prefix = (
			<strong><UserLink userName={userName} key={userName} /></strong>
		);

		const suffix = (
			<span className="channel">
				in <ChannelLink
					channel={userData.channel}
					channelName={userData.channelName}
					key={userData.channel}
					/>
			</span>
		);

		return <TimedItem
				className={className}
				time={userData.time}
				prefix={prefix}
				suffix={suffix}
				/>;
	}
}

TimedUserItem.propTypes = {
	friendsList: PropTypes.object,
	userData: PropTypes.object,
	userName: PropTypes.string
};

export default connect(({ friendsList }) => ({ friendsList }))(TimedUserItem);
