import React, { Component, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router";
import moment from "moment";

import TimedItem from "./TimedItem.jsx";
import { RELATIONSHIP_BEST_FRIEND } from "../constants";
import { internalUrl, formatTime } from "../lib/formatting";

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
			<Link to={internalUrl("/user/" + userName.toLowerCase())}>
				<strong>{ userName }</strong>
			</Link>
		);

		const suffix = (
			<span className="channel">
				in <Link className="invisible"
					to={internalUrl("/channel/" + userData.channel)}>
					{ userData.channelName || userData.channel }
				</Link>
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
