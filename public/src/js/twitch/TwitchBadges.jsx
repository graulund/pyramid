import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import TwitchEmoticon from "./TwitchEmoticon.jsx";
import { requestChannelData } from "../lib/io";

const BADGE_SIZE = 18;
const dataRequestedForChannels = [];

class TwitchBadges extends PureComponent {
	renderBadge(badge) {
		let {
			image_url_1x,
			image_url_2x,
			image_url_4x,
			title,
			click_action,
			click_url
		} = badge;

		let urlSet = {
			1: image_url_1x,
			2: image_url_2x,
			4: image_url_4x
		};

		let b = (
			<TwitchEmoticon
				text={title}
				urlSet={urlSet}
				width={BADGE_SIZE}
				height={BADGE_SIZE}
				largeWidth={4*BADGE_SIZE}
				largeHeight={4*BADGE_SIZE}
				key={title} />
		);

		if (click_action === "visit_url") {
			return (
				<a
					href={click_url}
					target="_blank"
					rel="nofollow noopener noreferrer"
					key={title}>
					{ b }
				</a>
			);
		}

		return b;
	}

	render() {
		let { badgeObjects } = this.props;

		if (badgeObjects && badgeObjects.length) {
			return (
				<span className="twitch-badges">
					{ badgeObjects.map(this.renderBadge) }
				</span>
			);
		}

		return null;
	}
}

TwitchBadges.propTypes = {
	badges: PropTypes.array.isRequired,
	badgeObjects: PropTypes.array,
	channel: PropTypes.string.isRequired,
	server: PropTypes.string.isRequired
};

const requestChannelBadgeData = function(channel) {
	// Make sure we never request more than once for each channel

	if (dataRequestedForChannels.indexOf(channel) < 0) {
		dataRequestedForChannels.push(channel);
		requestChannelData(channel);
	}
};

const mapStateToProps = function(state, ownProps) {
	let { channelData, serverData } = state;
	let { badges, channel, server } = ownProps;

	// No badges

	if (!(badges instanceof Array) || !badges || !badges.length) {
		return {};
	}

	let channelBadgeData = channelData[channel] && channelData[channel].badgeData;
	let serverBadgeData = serverData[server] && serverData[server].badgeData;

	// Request data if we don't already have it

	if (!channelBadgeData) {
		requestChannelBadgeData(channel);
	}

	// No badge data

	if (!channelBadgeData && !serverBadgeData) {
		return {};
	}

	// Format data

	let dataSources = [
		channelBadgeData || {},
		serverBadgeData || {}
	];

	let badgeObjects = [];

	badges.forEach((b) => {
		if (b && b.badge && b.version) {
			let { badge, version } = b;
			for (var i = 0; i < dataSources.length; i++) {
				let data = dataSources[i];

				if (
					data &&
					data[badge] &&
					data[badge].versions &&
					data[badge].versions[version]
				) {
					badgeObjects.push(data[badge].versions[version]);
					break;
				}
			}
		}
	});

	return { badgeObjects };
};

export default connect(mapStateToProps)(TwitchBadges);
