import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChannelLink from "./ChannelLink.jsx";
import TimedItem from "./TimedItem.jsx";
import UserLink from "./UserLink.jsx";
import { RELATIONSHIP_BEST_FRIEND } from "../constants";
import { getChannelDisplayNameFromState } from "../lib/channelNames";

class TimedUserItem extends PureComponent {

	render() {
		const {
			channelDisplayName,
			contextChannel,
			displayOnline = false,
			friendsList = {},
			lastSeenData = {},
			onlineFriends = [],
			skipOld = true,
			symbol = "",
			username,
			visible
		} = this.props;

		let { displayName, time } = lastSeenData;

		var classNames = [];

		if (
			friendsList[RELATIONSHIP_BEST_FRIEND] &&
			friendsList[RELATIONSHIP_BEST_FRIEND]
				.indexOf(username.toLowerCase()) >= 0
		) {
			classNames.push("bestfriend");
		}

		if (
			displayOnline &&
			onlineFriends.indexOf(username.toLowerCase()) >= 0
		) {
			classNames.push("online");
		}

		var className = classNames.join(" ");

		const prefix = (
			<strong>
				{ symbol }
				<UserLink
					username={username}
					displayName={displayName}
					key={username} />
			</strong>
		);

		var suffix = null;

		if (lastSeenData && lastSeenData.channel) {
			let { channel, channelName } = lastSeenData;
			const channelEl = contextChannel === channel
				? "here"
				: [
					"in ",
					<ChannelLink
						noConversationName
						channel={channel}
						channelName={channelName}
						displayName={channelDisplayName}
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
				visible={visible}
				key="main"
				/>;
	}
}

TimedUserItem.propTypes = {
	channelDisplayName: PropTypes.string,
	contextChannel: PropTypes.string,
	displayOnline: PropTypes.bool,
	friendsList: PropTypes.object,
	lastSeenData: PropTypes.object,
	onlineFriends: PropTypes.array,
	skipOld: PropTypes.bool,
	symbol: PropTypes.string,
	username: PropTypes.string,
	visible: PropTypes.bool
};

const mapStateToProps = function(state, ownProps) {
	let { lastSeenData = {} } = ownProps;
	let { channel } = lastSeenData;
	let { friendsList, onlineFriends } = state;

	let channelDisplayName = getChannelDisplayNameFromState(state, channel);

	return {
		channelDisplayName,
		friendsList,
		onlineFriends
	};
};

export default connect(mapStateToProps)(TimedUserItem);
