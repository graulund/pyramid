import React, { PureComponent, PropTypes } from "react";
import Linkify from "react-linkify";
//import Highlighter from "react-highlight-words";

import HighlightObserver from "./HighlightObserver.jsx";
import UserLink from "./UserLink.jsx";

const linkifyProperties = { target: "_blank" };

const EMOTE_IMG_URL_ROOT = "//static-cdn.jtvnw.net/emoticons/v1/";

class ChatMessageLine extends PureComponent {

	renderEmoticon(emoteId, emoteText, emoteKey) {
		// TODO: THIS SHOULD SO MUCH BE SOME PLACE ELSE BUT SHUT IT FOR NOW

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

	renderMessage() {
		// Emoticons
		// TODO: THIS SHOULD BE SOME PLACE ELSE

		const { message, tags } = this.props;

		if (tags && tags.emotes) {
			// Find all indices and sort, return array
			var allEmotes = [];
			tags.emotes.forEach((e) => {
				if (e && e.indices) {
					e.indices.forEach((i) => {
						if (i) {
							const start = parseInt(i.start, 10);
							const end = parseInt(i.end, 10);

							if (!isNaN(start) && !isNaN(end)) {
								allEmotes.push(
									{
										start,
										end,
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
					if (a.start < b.start) { return -1; }
					if (a.start > b.start) { return 1; }
					return 0;
				}
			});

			var output = [], lastEnd = 0, msgArray = [...message];

			allEmotes.forEach((e, index) => {
				output.push(msgArray.slice(lastEnd, e.start).join(""));
				output.push(this.renderEmoticon(
					e.number, msgArray.slice(e.start, e.end + 1).join(""), index
				));
				lastEnd = e.end + 1;
			});

			output.push(msgArray.slice(lastEnd).join(""));
			return output;
		}

		return message;
	}

	render() {
		const {
			color, displayUsername, highlight, id, isAction,
			message, observer, symbol = "", username
		} = this.props;

		const isHighlight = !!(highlight && highlight.length);
		const className = "msg" +
			(isAction ? " msg--action" : "") +
			(isHighlight ? " msg--highlight" : "");

		var messageEl = this.renderMessage(message);

		/* if (highlight && highlight.length) {
			// TODO: Find better non-plain text solution for this
			messageEl = <Highlighter searchWords={highlight} textToHighlight={message} />;
		} */

		var authorClassName = "msg__author";

		if (typeof color === "number" && color >= 0) {
			authorClassName += " msg__author--color-" + color;
		}

		const content = (
			<span className={className}>
				{ displayUsername
					? (
						<strong className={authorClassName}>
							{ symbol }
							<UserLink userName={username} key={username} />
							{" "}
						</strong>
					) : null }
				<span><Linkify properties={linkifyProperties}>
					{ messageEl }
				</Linkify></span>
			</span>
		);

		if (isHighlight) {
			return (
				<HighlightObserver
					id={id}
					observer={observer}
					key="highlightobserver">
					{ content }
				</HighlightObserver>
			);
		}

		return content;
	}
}

ChatMessageLine.propTypes = {
	channel: PropTypes.string,
	channelName: PropTypes.string,
	color: PropTypes.number,
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	highlight: PropTypes.array,
	id: PropTypes.string,
	isAction: PropTypes.bool,
	message: PropTypes.string,
	observer: PropTypes.object,
	server: PropTypes.string,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatMessageLine;
