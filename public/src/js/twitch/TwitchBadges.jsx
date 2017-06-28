import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

const BADGE_SIZE = 18;

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

		let srcSet = [
			`${image_url_1x} 1x`,
			`${image_url_2x} 2x`,
			`${image_url_4x} 4x`
		];

		let b = (
			<img
				src={image_url_1x}
				srcSet={srcSet.join(", ")}
				width={BADGE_SIZE}
				height={BADGE_SIZE}
				alt={title}
				title={title}
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

const mapStateToProps = function(state, ownProps) {
	let { channelData, serverData } = state;
	let { badges, channel, server } = ownProps;

	let channelBadgeData = channelData[channel] && channelData[channel].badgeData;
	let serverBadgeData = serverData[server] && serverData[server].badgeData;

	if (!(badges instanceof Array) || (!channelBadgeData && !serverBadgeData)) {
		return {};
	}

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
