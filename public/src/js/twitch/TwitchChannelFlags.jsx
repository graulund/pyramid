import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import forOwn from "lodash/forOwn";

import { pluralize } from "../lib/formatting";

const TWITCH_CHANNEL_FLAGS_LABELS = {
	"emote-only": "emote",
	"followers-only": "follow",
	"r9k": "r9k",
	"slow": "slow",
	"subs-only": "sub"
};

class TwitchChannelFlags extends PureComponent {

	render() {
		let { channelData = {} } = this.props;
		let { roomState } = channelData;

		if (roomState) {

			let flags = [], added = false;
			let roomId = roomState["room-id"];

			forOwn(TWITCH_CHANNEL_FLAGS_LABELS, (label, prop) => {
				let value = parseInt(roomState[prop], 10);

				// Flip weird value for followers prop
				if (prop === "followers-only" && !isNaN(value)) {
					if (value === -1) { value = 0; } // Off
					else if (value === 0) { value = -1; } // On, no duration
				}

				// Parse and display value
				if (value && !isNaN(value)) {
					var tooltip;

					// Slow mode
					if (prop === "slow") {
						let seconds = pluralize(value, "second", "s");
						tooltip = `${value} ${seconds} between messages`;
					}

					// Followers only mode
					else if (prop === "followers-only") {

						// Abort if no room id
						if (!roomId || roomId === "0") {
							return;
						}

						if (value > 0) {
							let minutes = pluralize(value, "minute", "s");
							tooltip = `Chat after following for ${value} ${minutes}`;
						}
						else {
							tooltip = "Chat after following";
						}
					}

					flags.push({ label, tooltip });
					added = true;
				}
			});

			if (added) {
				return (
					<ul className="chatview__channel-flags" key="flags">
						{ flags.map(({ label, tooltip }) => (
							<li
								key={label}
								title={tooltip}>
								{ label }
							</li>
						)) }
					</ul>
				);
			}
		}

		return null;
	}
}

TwitchChannelFlags.propTypes = {
	channelData: PropTypes.object
};

export default TwitchChannelFlags;
