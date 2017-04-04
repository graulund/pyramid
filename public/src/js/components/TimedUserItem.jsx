import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import ChannelLink from "./ChannelLink.jsx";
import TimedItem from "./TimedItem.jsx";
import UserLink from "./UserLink.jsx";
import { RELATIONSHIP_BEST_FRIEND } from "../constants";

class TimedUserItem extends PureComponent {

	render() {
		const {
			friendsList, skipOld = true, symbol = "", userData, userName
		} = this.props;

		var classNames = [];

		if (
			friendsList[RELATIONSHIP_BEST_FRIEND] &&
			friendsList[RELATIONSHIP_BEST_FRIEND].indexOf(userName) >= 0
		) {
			classNames.push("bestfriend");
		}

		var className = classNames.join(" ");

		const prefix = (
			<strong>{ symbol }<UserLink userName={userName} key={userName} /></strong>
		);

		var suffix = null;

		if (userData) {
			suffix = (
				<span className="channel">
					in <ChannelLink
						channel={userData.channel}
						channelName={userData.channelName}
						key={userData.channel}
						/>
				</span>
			);
		}

		return <TimedItem
				className={className}
				time={userData && userData.time}
				prefix={prefix}
				suffix={suffix}
				skipOld={skipOld}
				key="main"
				/>;
	}
}

TimedUserItem.propTypes = {
	friendsList: PropTypes.object,
	skipOld: PropTypes.bool,
	symbol: PropTypes.string,
	userData: PropTypes.object,
	userName: PropTypes.string
};

export default connect(({ friendsList }) => ({ friendsList }))(TimedUserItem);
