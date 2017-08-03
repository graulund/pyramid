import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Tipsy from "react-tipsy";

import { refElSetter } from "../../lib/refEls";

const emojiImageUrl = function(codepoints) {
	return `https://twemoji.maxcdn.com/2/svg/${codepoints}.svg`;
};

class Emoji extends PureComponent {
	constructor(props) {
		super(props);

		this.onLoad = this.onLoad.bind(this);
		this.onTooltipLoad = this.onTooltipLoad.bind(this);

		this.els = {};
		this.setTooltip = refElSetter("tooltip").bind(this);
	}

	onLoad() {
		let { onLoad } = this.props;
		if (typeof onLoad === "function") {
			onLoad();
		}
	}

	onTooltipLoad() {
		let { tooltip } = this.els;

		if (tooltip) {
			tooltip.updatePosition();
		}
	}

	renderEmoji(variant = "") {
		let { codepoints, enableEmojiImages, text } = this.props;
		let className = "emoji" + (variant ? "-" + variant : "");

		if (enableEmojiImages) {
			return <img
				className={className}
				src={emojiImageUrl(codepoints)}
				alt={text}
				key="emoji-img"
				/>;
		}

		return (
			<span className={`text-${className}`} key="emoji">
				{ text }
			</span>
		);
	}

	render() {
		let { enableEmojiCodes, name } = this.props;

		let tooltipContent = [
			this.renderEmoji("large"),
			(enableEmojiCodes && name
				? <div key="name">{ `:${name}:` }</div> : null)
		];

		return (
			<Tipsy ref={this.setTooltip} content={tooltipContent}>
				{ this.renderEmoji() }
			</Tipsy>
		);
	}
}

Emoji.propTypes = {
	codepoints: PropTypes.string,
	enableEmojiCodes: PropTypes.bool,
	enableEmojiImages: PropTypes.bool,
	onLoad: PropTypes.func,
	name: PropTypes.string,
	text: PropTypes.string
};

export default Emoji;
