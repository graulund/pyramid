import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChannelLink from "./ChannelLink.jsx";
import TimedItem from "./TimedItem.jsx";
import UserLink from "./UserLink.jsx";
import { RELATIONSHIP_BEST_FRIEND } from "../constants";

class TimedUserItem extends PureComponent {

	render() {
		const {
			channel,
			channelName,
			contextChannel,
			displayName,
			displayOnline = false,
			friendsList = {},
			onlineFriends = [],
			skipOld = true,
			symbol = "",
			time,
			userName
		} = this.props;

		var classNames = [];

		if (
			friendsList[RELATIONSHIP_BEST_FRIEND] &&
			friendsList[RELATIONSHIP_BEST_FRIEND].indexOf(userName.toLowerCase()) >= 0
		) {
			classNames.push("bestfriend");
		}

		if (displayOnline && onlineFriends.indexOf(userName.toLowerCase()) >= 0) {
			classNames.push("online");
		}

		var className = classNames.join(" ");

		const prefix = (
			<strong>
				{ symbol }
				<UserLink
					userName={userName}
					displayName={displayName}
					key={userName} />
			</strong>
		);

		var suffix = null;

		if (channel) {
			const channelEl = contextChannel === channel
				? "here"
				: [
					"in ",
					<ChannelLink
						channel={channel}
						channelName={channelName}
						key={channel}
						/>
				];

			suffix = <span className="channel">{ channelEl }</span>;
		}

		return <TimedItem
				className={className}
				time={time}
				prefix={prefix}
				suffix={suffix}
				skipOld={skipOld}
				key="main"
				/>;
	}
}

TimedUserItem.propTypes = {
	channel: PropTypes.string,
	channelName: PropTypes.string,
	contextChannel: PropTypes.string,
	displayName: PropTypes.string,
	displayOnline: PropTypes.bool,
	friendsList: PropTypes.object,
	onlineFriends: PropTypes.array,
	skipOld: PropTypes.bool,
	symbol: PropTypes.string,
	time: PropTypes.string,
	userName: PropTypes.string
};

export default connect(({
	friendsList,
	onlineFriends
}) => ({
	friendsList,
	onlineFriends
}))(TimedUserItem);
