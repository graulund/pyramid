import React, { PureComponent, PropTypes } from "react";
import Linkify from "react-linkify";

import { stickToTheBottom } from "../lib/visualBehavior";
import { LINKIFY_PROPERTIES } from "../constants";

const EMOTE_IMG_URL_ROOT = "//static-cdn.jtvnw.net/emoticons/v1/";
const EMOTE_FFZ_IMG_URL_ROOT = "//cdn.frankerfacez.com/emoticon/";
const EMOTE_BTTV_IMG_URL_ROOT = "//cdn.betterttv.net/emote/";

const EMOTE_FFZ_REPLACEMENT_ROOT = "//cdn.frankerfacez.com/script/replacements/";

const EMOTE_REPLACEMENTS = {
	15: EMOTE_FFZ_REPLACEMENT_ROOT + "15-JKanStyle.png",
	16: EMOTE_FFZ_REPLACEMENT_ROOT + "16-OptimizePrime.png",
	17: EMOTE_FFZ_REPLACEMENT_ROOT + "17-StoneLightning.png",
	18: EMOTE_FFZ_REPLACEMENT_ROOT + "18-TheRinger.png",
	19: EMOTE_FFZ_REPLACEMENT_ROOT + "19-PazPazowitz.png",
	20: EMOTE_FFZ_REPLACEMENT_ROOT + "20-EagleEye.png",
	21: EMOTE_FFZ_REPLACEMENT_ROOT + "21-CougarHunt.png",
	22: EMOTE_FFZ_REPLACEMENT_ROOT + "22-RedCoat.png",
	26: EMOTE_FFZ_REPLACEMENT_ROOT + "26-JonCarnage.png",
	27: EMOTE_FFZ_REPLACEMENT_ROOT + "27-PicoMause.png",
	30: EMOTE_FFZ_REPLACEMENT_ROOT + "30-BCWarrior.png",
	33: EMOTE_FFZ_REPLACEMENT_ROOT + "33-DansGame.png",
	36: EMOTE_FFZ_REPLACEMENT_ROOT + "36-PJSalt.png"
};

const getEmoticonUrlsets = (emote) => {
	const output = {};
	switch (emote.type) {
		case "ffz":
			output.src = EMOTE_FFZ_IMG_URL_ROOT + emote.id + "/1";
			if (emote.sizes && emote.sizes.length) {
				output.srcSet = emote.sizes.map((size) => {
					return EMOTE_FFZ_IMG_URL_ROOT + emote.id + "/" + size +
						" " + size + "x";
				});
			}
			else {
				output.srcSet = [output.src + " 1x"];
			}
			break;
		case "bttv":
			output.src = EMOTE_BTTV_IMG_URL_ROOT + emote.id + "/1x";
			output.srcSet = [
				EMOTE_BTTV_IMG_URL_ROOT + emote.id + "/1x 1x",
				EMOTE_BTTV_IMG_URL_ROOT + emote.id + "/2x 2x",
				EMOTE_BTTV_IMG_URL_ROOT + emote.id + "/3x 3x"
			];
			break;
		default:
			// Assume normal
			if (emote.id in EMOTE_REPLACEMENTS) {
				output.src = EMOTE_REPLACEMENTS[emote.id];
				output.srcSet = [output.src + " 1x"];
			}
			else {
				output.src = EMOTE_IMG_URL_ROOT + emote.id + "/1.0";
				output.srcSet = [
					EMOTE_IMG_URL_ROOT + emote.id + "/1.0 1x",
					EMOTE_IMG_URL_ROOT + emote.id + "/2.0 2x",
					EMOTE_IMG_URL_ROOT + emote.id + "/3.0 3x"
				];
			}
	}

	return output;
};

class TwitchMessageLine extends PureComponent {

	renderEmoticon(emote, emoteText, emoteKey) {
		const url = getEmoticonUrlsets(emote);
		return <img
			src={url.src}
			srcSet={url.srcSet.join(", ")}
			alt={emoteText}
			title={emoteText}
			key={`emote-${emoteKey}`}
			onLoad={() => stickToTheBottom()}
			/>;
	}

	renderText(text, key) {
		const { linkify = true } = this.props;

		if (linkify && text) {
			return (
				<Linkify properties={LINKIFY_PROPERTIES} key={`text-${key}`}>
					{ text }
				</Linkify>
			);
		}

		return text;
	}

	render() {
		const { children, message, tags } = this.props;
		const input = message || children;
		var output = input;

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
								allEmotes.push({ ...e, first, last });
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

			if (typeof input === "string") {
				var lastEnd = 0, msgArray = [...input];

				output = [];

				allEmotes.forEach((e, index) => {
					output.push(
						this.renderText(
							msgArray.slice(lastEnd, e.first).join(""), index
						)
					);
					output.push(
						this.renderEmoticon(
							e, msgArray.slice(e.first, e.last + 1).join(""), index
						)
					);
					lastEnd = e.last + 1;
				});

				output.push(
					this.renderText(
						msgArray.slice(lastEnd).join(""), "final"
					)
				);
			}
		}

		return <span>{ output }</span>;
	}
}

TwitchMessageLine.propTypes = {
	children: PropTypes.node,
	linkify: PropTypes.bool,
	message: PropTypes.string,
	tags: PropTypes.object
};

export default TwitchMessageLine;
