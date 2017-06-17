import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import forOwn from "lodash/forOwn";
import mapValues from "lodash/mapValues";

import SortedItemList from "./SortedItemList.jsx";
import TimedChannelItem from "./TimedChannelItem.jsx";
import { getChannelUri } from "../lib/channelNames";
import { getTwitchChannelDisplayNameString } from "../lib/displayNames";

const nameSorter = function(
	enableTwitchChannelDisplayNames,
	enableTwitchUserDisplayNames,
	serverIsTwitch
) {
	return function(channel) {
		let { displayName, name, server } = channel;
		let displayedName = name;

		if (serverIsTwitch[server]) {
			displayedName = getTwitchChannelDisplayNameString(
				name,
				displayName,
				enableTwitchChannelDisplayNames,
				enableTwitchUserDisplayNames
			);
		}

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
		this.sortableName = nameSorter(true, 1, props.serverIsTwitch);
	}

	componentWillReceiveProps(newProps) {
		let {
			enableTwitchChannelDisplayNames: oldTcdn,
			enableTwitchUserDisplayNames: oldTudn,
			serverIsTwitch: oldSit
		} = this.props;
		let {
			enableTwitchChannelDisplayNames: newTcdn,
			enableTwitchUserDisplayNames: newTudn,
			serverIsTwitch: newSit
		} = newProps;

		if (oldTcdn !== newTcdn || oldTudn !== newTudn || oldSit !== newSit) {
			this.sortableName = nameSorter(newTcdn, newTudn, newSit);
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
		let { configChannels, sort } = this.props;

		return <SortedItemList
			getIdForItem={getDataChannel}
			id="channellist"
			list={configChannels}
			noItemsText="No channels :("
			renderItem={this.renderChannelItem}
			sort={sort}
			sortableNameForItem={this.sortableName}
			/>;
	}
}

ChannelList.propTypes = {
	configChannels: PropTypes.array,
	enableTwitchChannelDisplayNames: PropTypes.bool,
	enableTwitchUserDisplayNames: PropTypes.number,
	hideOldChannels: PropTypes.bool,
	serverIsTwitch: PropTypes.object,
	sort: PropTypes.string,
	visible: PropTypes.bool
};

const mapStateToProps = function(state) {
	let { appConfig, ircConfigs, lastSeenChannels, serverData } = state;

	let {
		enableTwitch,
		enableTwitchChannelDisplayNames,
		enableTwitchUserDisplayNames,
		hideOldChannels
	} = appConfig;

	// Only the relevant channel data

	let configChannels = [];

	forOwn(ircConfigs, (server, serverName) => {
		if (server && server.channels) {
			forOwn(server.channels, (channel, name) => {
				let channelUri = getChannelUri(serverName, name);

				configChannels.push({
					...channel,
					channel: channelUri,
					lastSeen: lastSeenChannels[channelUri],
					server: serverName
				});
			});
		}
	});

	// Only the relevant server data

	let serverIsTwitch = mapValues(serverData,
		(s) => enableTwitch && s && s.isTwitch
	);

	return {
		configChannels,
		enableTwitchChannelDisplayNames:
			enableTwitch && enableTwitchChannelDisplayNames,
		enableTwitchUserDisplayNames:
			enableTwitch && enableTwitchUserDisplayNames,
		hideOldChannels,
		serverIsTwitch
	};
};

export default connect(mapStateToProps)(ChannelList);
