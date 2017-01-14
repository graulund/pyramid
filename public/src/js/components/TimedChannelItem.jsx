import React, { PureComponent, PropTypes } from "react";

import ChannelLink from "./ChannelLink.jsx";
import TimedItem from "./TimedItem.jsx";
import UserLink from "./UserLink.jsx";

class TimedChannelItem extends PureComponent {

	render() {
		const { channel, displayServer = false, lastSeenData = {} } = this.props;

		const prefix = <ChannelLink
			strong
			channel={channel}
			displayServer={displayServer}
			key={channel}
			/>;

		const suffix = lastSeenData && lastSeenData.username ? (
			<span className="msg">
				by <UserLink
					userName={lastSeenData.username}
					className="invisible"
					key={lastSeenData.username}
					/>
			</span>
		) : null;

		return <TimedItem
				time={lastSeenData.time}
				skipOld={false}
				prefix={prefix}
				suffix={suffix}
				key="main"
				/>;
	}
}

TimedChannelItem.propTypes = {
	channel: PropTypes.string,
	displayServer: PropTypes.bool,
	lastSeenData: PropTypes.object
};

export default TimedChannelItem;
