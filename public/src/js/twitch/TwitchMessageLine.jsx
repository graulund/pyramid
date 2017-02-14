import React, { PureComponent, PropTypes } from "react";

const EMOTE_IMG_URL_ROOT = "//static-cdn.jtvnw.net/emoticons/v1/";

class TwitchMessageLine extends PureComponent {

	renderEmoticon(emoteId, emoteText, emoteKey) {
		return <img
			src={EMOTE_IMG_URL_ROOT + emoteId + "/1.0"}
			srcSet={
				EMOTE_IMG_URL_ROOT + emoteId + "/1.0 1x, " +
				EMOTE_IMG_URL_ROOT + emoteId + "/2.0 2x"
			}
			alt={emoteText}
			key={`emote-${emoteKey}`}
			/>;
	}

	render() {
		const { message, tags } = this.props;
		var output = message;

		if (tags && tags.emotes && tags.emotes instanceof Array) {
			// Find all indices and sort, return array
			var allEmotes = [];
			tags.emotes.forEach((e) => {
				if (e && e.indices) {
					e.indices.forEach((i) => {
						if (i) {
							const first = parseInt(i.first, 10);
							const last = parseInt(i.last, 10);

							if (!isNaN(first) && !isNaN(last)) {
								allEmotes.push(
									{
										first,
										last,
										number: e.number
									}
								);
							}
						}
					});
				}
			});

			allEmotes.sort((a, b) => {
				if (a && b) {
					if (a.first < b.first) { return -1; }
					if (a.first > b.first) { return 1; }
					return 0;
				}
			});

			var lastEnd = 0, msgArray = [...message];

			output = [];

			allEmotes.forEach((e, index) => {
				output.push(msgArray.slice(lastEnd, e.first).join(""));
				output.push(this.renderEmoticon(
					e.number, msgArray.slice(e.first, e.last + 1).join(""), index
				));
				lastEnd = e.last + 1;
			});

			output.push(msgArray.slice(lastEnd).join(""));
		}

		return <span>{ output }</span>;
	}
}

TwitchMessageLine.propTypes = {
	message: PropTypes.string,
	tags: PropTypes.object
};

export default TwitchMessageLine;
