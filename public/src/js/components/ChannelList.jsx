import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import SortedItemList from "./SortedItemList.jsx";
import TimedChannelItem from "./TimedChannelItem.jsx";
import { getChannelUri } from "../lib/channelNames";
import { getTwitchChannelDisplayNameString } from "../lib/displayNames";

const nameSorter = function(
	enableTwitchChannelDisplayNames,
	enableTwitchUserDisplayNames
) {
	return function(channel) {
		let { channelName, displayName } = channel;

		// TODO: Only do this for channels in servers where isTwitch is true
		let displayedName = getTwitchChannelDisplayNameString(
			channelName,
			displayName,
			enableTwitchChannelDisplayNames,
			enableTwitchUserDisplayNames
		);

		// Sortable modification
		return displayedName.replace(/^#*_*/, "").toLowerCase();
	};
};

const getDataChannel = function(data) {
	return data && data.channel;
};

class ChannelList extends PureComponent {
	constructor(props) {
		super(props);

		this.renderChannelItem = this.renderChannelItem.bind(this);
		this.sortableName = nameSorter(true, 1);
	}

	componentWillReceiveProps(newProps) {
		let {
			enableTwitchChannelDisplayNames: oldTcdn,
			enableTwitchUserDisplayNames: oldTudn,
		} = this.props;
		let {
			enableTwitchChannelDisplayNames: newTcdn,
			enableTwitchUserDisplayNames: newTudn,
		} = newProps;

		if (oldTcdn !== newTcdn || oldTudn !== newTudn) {
			this.sortableName = nameSorter(newTcdn, newTudn);
		}
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

		for (var server in ircConfigs) {
			var info = ircConfigs[server];
			if (info && info.channels) {
				let channelNames = Object.keys(info.channels);
				if (channelNames && channelNames.length) {
					ircChannels = ircChannels.concat(channelNames.map((channelName) => {
						if (channelName) {
							let displayName = info.channels[channelName].displayName;
							return {
								channel: getChannelUri(server, channelName),
								channelName,
								displayName,
								server
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
			sortableNameForItem={this.sortableName}
			/>;
	}
}

ChannelList.propTypes = {
	enableTwitchChannelDisplayNames: PropTypes.bool,
	enableTwitchUserDisplayNames: PropTypes.number,
	hideOldChannels: PropTypes.bool,
	ircConfigs: PropTypes.object,
	lastSeenChannels: PropTypes.object,
	sort: PropTypes.string,
	visible: PropTypes.bool
};

export default connect(({
	appConfig: {
		enableTwitchChannelDisplayNames,
		enableTwitchUserDisplayNames,
		hideOldChannels
	},
	ircConfigs,
	lastSeenChannels
}) => ({
	enableTwitchChannelDisplayNames,
	enableTwitchUserDisplayNames,
	hideOldChannels,
	ircConfigs,
	lastSeenChannels
}))(ChannelList);
