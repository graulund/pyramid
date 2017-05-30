import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import TimedChannelItem from "./TimedChannelItem.jsx";
import { channelUrlFromNames } from "../lib/channelNames";
import { minuteTime } from "../lib/formatting";

const defaultLastSeenData = { time: "" };

class ChannelList extends PureComponent {
	render() {
		const {
			hideOldChannels = false,
			ircConfigs,
			lastSeenChannels,
			sort,
			visible
		} = this.props;

		// Load IRC channels from the configuration

		var ircChannels = [];

		for (var irc in ircConfigs) {
			var info = ircConfigs[irc];
			if (info && info.channels) {
				let channelNames = Object.keys(info.channels);
				if (channelNames && channelNames.length) {
					ircChannels = ircChannels.concat(channelNames.map((channelName) => {
						if (channelName) {
							let displayName = info.channels[channelName].displayName;
							return {
								channel: channelUrlFromNames(irc, channelName),
								channelName,
								displayName,
								server: irc
							};
						}

						return null;
					}));
				}

			}
		}

		// Enhancing the list with activity data

		ircChannels = ircChannels.map((data) => {
			if (data) {
				var lastSeenData = defaultLastSeenData;
				if (data.channel && lastSeenChannels && data.channel in lastSeenChannels) {
					lastSeenData = lastSeenChannels[data.channel];
				}
				data.lastSeen = lastSeenData;
			}

			return data;
		});

		// Sorting

		const sortableName = function(channel) {
			let name = channel.displayName || channel.channelName;
			return name.replace(/^#/, "").toLowerCase();
		};

		const alphaSorting = function(a, b) {
			if (a && b) {
				return sortableName(a).localeCompare(sortableName(b));
			}
			return -1;
		};

		if (sort === "activity") {
			// Sorting by last activity
			ircChannels.sort((a, b) => {
				if (a && b) {
					var sort = -1 * minuteTime(a.lastSeen.time).localeCompare(
						minuteTime(b.lastSeen.time)
					);

					if (sort === 0) {
						// Sort by channel name as a backup
						return alphaSorting(a, b);
					}

					return sort;
				}
				return 1;
			});
		} else {
			// Sorting by channel name
			ircChannels.sort(alphaSorting);
		}

		// Rendering

		var channelListNodes;
		if (ircChannels.length) {
			channelListNodes = ircChannels.map((data) => {
				if (data && data.channel) {
					let { channel, displayName, lastSeen } = data;
					let lastSeenData = lastSeen || defaultLastSeenData;
					return <TimedChannelItem
						channel={channel}
						displayName={displayName}
						lastSeenData={lastSeenData}
						skipOld={hideOldChannels}
						visible={visible}
						key={channel} />;
				}
				return null;
			});
		}
		else {
			channelListNodes = [
				<li className="nothing" key="nothing">No channels :(</li>
			];
		}

		return <ul id="channellist" className="itemlist">{ channelListNodes }</ul>;
	}
}

ChannelList.propTypes = {
	hideOldChannels: PropTypes.bool,
	ircConfigs: PropTypes.object,
	lastSeenChannels: PropTypes.object,
	sort: PropTypes.string,
	visible: PropTypes.bool
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
