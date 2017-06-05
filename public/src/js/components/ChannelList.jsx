import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import SortedItemList from "./SortedItemList.jsx";
import TimedChannelItem from "./TimedChannelItem.jsx";
import { channelUrlFromNames } from "../lib/channelNames";

const sortableName = function(channel) {
	let name = channel.displayName || channel.channelName;
	return name.replace(/^#/, "").toLowerCase();
};

const getDataChannel = function(data) {
	return data && data.channel;
};

class ChannelList extends PureComponent {
	constructor(props) {
		super(props);

		this.renderChannelItem = this.renderChannelItem.bind(this);
	}

	renderChannelItem(data) {
		let { hideOldChannels = false, visible } = this.props;
		if (data && data.channel) {
			let { channel, displayName, lastSeen } = data;
			return <TimedChannelItem
				channel={channel}
				displayName={displayName}
				lastSeenData={lastSeen}
				skipOld={hideOldChannels}
				visible={visible}
				key={channel} />;
		}
		return null;
	}

	render() {
		let { ircConfigs, lastSeenChannels, sort } = this.props;

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
			if (
				data &&
				data.channel &&
				lastSeenChannels &&
				data.channel in lastSeenChannels
			) {
				data.lastSeen = lastSeenChannels[data.channel];
			}

			return data;
		});

		return <SortedItemList
			getIdForItem={getDataChannel}
			id="channellist"
			list={ircChannels}
			noItemsText="No channels :("
			renderItem={this.renderChannelItem}
			sort={sort}
			sortableNameForItem={sortableName}
			/>;
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
