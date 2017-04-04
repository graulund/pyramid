import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import TimedChannelItem from "./TimedChannelItem.jsx";
import { channelUrlFromNames } from "../lib/channelNames";
import { minuteTime } from "../lib/formatting";

class ChannelList extends PureComponent {
	render() {
		const {
			hideOldChannels = false, ircConfigs, lastSeenChannels,
			sort
		} = this.props;

		// Load IRC channels from the configuration

		var ircChannels = [];

		for (var irc in ircConfigs) {
			var info = ircConfigs[irc];
			if (info && info.channels && info.channels.length) {
				ircChannels = ircChannels.concat(info.channels.map((channelName) => {
					if (channelName) {
						return {
							channel: channelUrlFromNames(irc, channelName),
							channelName,
							server: irc
						};
					}

					return null;
				}));
			}
		}

		// Enhancing the list with activity data

		ircChannels = ircChannels.map((data) => {
			if (data) {
				var lastSeenData = { time: "" };
				if (data.channel && lastSeenChannels && data.channel in lastSeenChannels) {
					lastSeenData = lastSeenChannels[data.channel];
				}
				data.lastSeen = lastSeenData;
			}

			return data;
		});

		// Sorting

		if (sort === "activity") {
			// Sorting by last activity
			ircChannels.sort((a, b) => {
				if (a && b) {
					var sort = -1 * minuteTime(a.lastSeen.time).localeCompare(
						minuteTime(b.lastSeen.time)
					);

					if (sort === 0) {
						// Sort by channel name as a backup
						return a.channelName.localeCompare(b.channelName);
					}

					return sort;
				}
				return 1;
			});
		} else {
			// Sorting by channel name
			ircChannels.sort((a, b) => {
				if (a && b) {
					return a.channelName.localeCompare(b.channelName);
				}
				return -1;
			});
		}

		// Rendering

		const channelListNodes = ircChannels.map((data) => {
			if (data && data.channel) {
				return <TimedChannelItem
					channel={data.channel}
					lastSeenData={data.lastSeen || {}}
					skipOld={hideOldChannels}
					key={data.channel} />;
			}
			return null;
		});

		return <ul id="channellist" className="itemlist">{ channelListNodes }</ul>;
	}
}

ChannelList.propTypes = {
	hideOldChannels: PropTypes.bool,
	ircConfigs: PropTypes.object,
	lastSeenChannels: PropTypes.object,
	sort: PropTypes.string
};

export default connect(({
	appConfig: { hideOldChannels },
	ircConfigs,
	lastSeenChannels
}) => ({
	hideOldChannels,
	ircConfigs,
	lastSeenChannels
}))(ChannelList);
