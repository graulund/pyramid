import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Tipsy from "react-tipsy";
import forOwn from "lodash/forOwn";

import { refElSetter } from "../lib/refEls";

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

const getEmoticonUrlsets = function(emote) {
	let { id, sizes, type, urlSet } = emote;
	let output = {};

	// Use directly given data if any
	// Assumes data structure pixelRatio => imageUrl

	if (urlSet) {
		output.src = urlSet[1];
		output.srcSet = [];

		forOwn(urlSet, (url, ratio) => {
			// Only allow whole numbers
			if (ratio % 1 === 0) {
				output.srcSet.push(`${url} ${ratio}x`);
			}
		});

		return output;
	}

	// Default behaviour

	switch (type) {
		case "ffz":
			output.src = EMOTE_FFZ_IMG_URL_ROOT + id + "/1";
			if (sizes && sizes.length) {
				output.srcSet = sizes.map((size) => {
					return EMOTE_FFZ_IMG_URL_ROOT +
						id + "/" + size + " " + size + "x";
				});
			}
			else {
				output.srcSet = [output.src + " 1x"];
			}
			break;
		case "bttv":
			output.src = EMOTE_BTTV_IMG_URL_ROOT + id + "/1x";
			output.srcSet = [
				EMOTE_BTTV_IMG_URL_ROOT + id + "/1x 1x",
				EMOTE_BTTV_IMG_URL_ROOT + id + "/2x 2x",
				EMOTE_BTTV_IMG_URL_ROOT + id + "/3x 4x"
			];
			break;
		default:
			// Assume normal
			if (id in EMOTE_REPLACEMENTS) {
				output.src = EMOTE_REPLACEMENTS[id];
				output.srcSet = [output.src + " 1x"];
			}
			else {
				output.src = EMOTE_IMG_URL_ROOT + id + "/1.0";
				output.srcSet = [
					EMOTE_IMG_URL_ROOT + id + "/1.0 1x",
					EMOTE_IMG_URL_ROOT + id + "/2.0 2x"
				];
				output.largeSrc = EMOTE_IMG_URL_ROOT + id + "/4.0 4x";
			}
	}

	return output;
};

class TwitchEmoticon extends PureComponent {
	constructor(props) {
		super(props);

		this.onLoad = this.onLoad.bind(this);
		this.onTooltipLoad = this.onTooltipLoad.bind(this);

		this.els = {};
		this.setTooltip = refElSetter("tooltip").bind(this);
	}

	onLoad() {
		const { onLoad } = this.props;
		if (typeof onLoad === "function") {
			onLoad();
		}
	}

	onTooltipLoad() {
		const { tooltip } = this.els;

		if (tooltip) {
			tooltip.updatePosition();
		}
	}

	render() {
		let {
			height,
			largeHeight,
			largeWidth,
			text,
			type,
			width
		} = this.props;

		let url = getEmoticonUrlsets(this.props);
		let largeImg = null;

		if (url.largeSrc || url.srcSet.length > 1) {
			let largestSrc = url.largeSrc || url.srcSet[url.srcSet.length-1];
			largeImg = <img
				src={largestSrc.replace(/\s.+$/, "")}
				width={largeWidth}
				height={largeHeight}
				alt=""
				onLoadStart={this.onTooltipLoad}
				onLoadedMetadata={this.onTooltipLoad}
				onLoad={this.onTooltipLoad}
				key="large"
				/>;
		}

		let tooltipContent = [
			largeImg,
			<div key="name">{ text }</div>,
			( type ? <div className="tooltip-secondary" key="type">{ type }</div> : null )
		];

		return (
			<Tipsy ref={this.setTooltip} content={tooltipContent}>
				<img
					src={url.src}
					srcSet={url.srcSet.join(", ")}
					width={width}
					height={height}
					alt={text}
					onLoad={this.onLoad}
					key="main"
					/>
			</Tipsy>
		);
	}
}

TwitchEmoticon.propTypes = {
	height: PropTypes.number,
	id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	largeWidth: PropTypes.number,
	largeHeight: PropTypes.number,
	onLoad: PropTypes.func,
	text: PropTypes.string,
	type: PropTypes.string,
	urlSet: PropTypes.object,
	width: PropTypes.number
};

export default TwitchEmoticon;
