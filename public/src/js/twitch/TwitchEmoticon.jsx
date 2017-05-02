import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import { stickToTheBottom } from "../lib/visualBehavior";

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

const srcSet = function(list, enable3xEmotes) {
	if (!enable3xEmotes) {
		return list.filter((item) => !/(3|4)x$/.test(item));
	}

	return list;
};

const getEmoticonUrlsets = function(emote, enable3xEmotes) {
	const output = {};
	switch (emote.type) {
		case "ffz":
			output.src = EMOTE_FFZ_IMG_URL_ROOT + emote.id + "/1";
			if (emote.sizes && emote.sizes.length) {
				output.srcSet = srcSet(emote.sizes.map((size) => {
					return EMOTE_FFZ_IMG_URL_ROOT +
						emote.id + "/" + size + " " + size + "x";
				}), enable3xEmotes);
			}
			else {
				output.srcSet = [output.src + " 1x"];
			}
			break;
		case "bttv":
			output.src = EMOTE_BTTV_IMG_URL_ROOT + emote.id + "/1x";
			output.srcSet = srcSet([
				EMOTE_BTTV_IMG_URL_ROOT + emote.id + "/1x 1x",
				EMOTE_BTTV_IMG_URL_ROOT + emote.id + "/2x 2x",
				EMOTE_BTTV_IMG_URL_ROOT + emote.id + "/3x 3x"
			], enable3xEmotes);
			break;
		default:
			// Assume normal
			if (emote.id in EMOTE_REPLACEMENTS) {
				output.src = EMOTE_REPLACEMENTS[emote.id];
				output.srcSet = [output.src + " 1x"];
			}
			else {
				output.src = EMOTE_IMG_URL_ROOT + emote.id + "/1.0";
				output.srcSet = srcSet([
					EMOTE_IMG_URL_ROOT + emote.id + "/1.0 1x",
					EMOTE_IMG_URL_ROOT + emote.id + "/2.0 2x",
					EMOTE_IMG_URL_ROOT + emote.id + "/3.0 3x"
				], enable3xEmotes);
			}
	}

	return output;
};

class TwitchEmoticon extends PureComponent {
	constructor(props) {
		super(props);
		this.onLoad = this.onLoad.bind(this);
	}

	onLoad() {
		const { onLoad = stickToTheBottom } = this.props;
		if (typeof onLoad === "function") {
			onLoad();
		}
	}

	render() {
		const { enable3xEmotes = false, text } = this.props;
		const url = getEmoticonUrlsets(this.props, enable3xEmotes);
		return <img
			src={url.src}
			srcSet={url.srcSet.join(", ")}
			alt={text}
			title={text}
			onLoad={this.onLoad}
			/>;
	}
}

TwitchEmoticon.propTypes = {
	enable3xEmotes: PropTypes.bool,
	id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	onLoad: PropTypes.func,
	text: PropTypes.string,
	type: PropTypes.string
};

export default TwitchEmoticon;
