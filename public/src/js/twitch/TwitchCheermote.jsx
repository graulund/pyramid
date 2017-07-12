import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import TwitchEmoticon from "./TwitchEmoticon.jsx";
import { TWITCH_CHEER_DISPLAY } from "../constants";
import { fixColorContrast } from "../lib/color";

const block = "twitch-cheermote";

class TwitchCheermote extends PureComponent {
	render() {

		let {
			amount,
			color,
			colorBlindness,
			enableDarkMode,
			images,
			onLoad,
			showTwitchCheers,
			text
		} = this.props;

		if (!showTwitchCheers) {
			return (
				<em className={`${block} ${block}--disabled`}>
					{ text }
				</em>
			);
		}

		let styles = {};

		if (color && typeof color === "string") {
			let fixedColor = fixColorContrast(color, colorBlindness);
			styles.color = enableDarkMode ? fixedColor.dark : fixedColor.light;
		}

		let lightness = enableDarkMode ? "dark" : "light";
		let displayPref = showTwitchCheers === TWITCH_CHEER_DISPLAY.ANIMATED
			? "animated" : "static";

		let urlSet = images[lightness][displayPref];

		return (
			<strong className={block} style={styles}>
				<TwitchEmoticon
					onLoad={onLoad}
					text={text}
					urlSet={urlSet}
					key="emote" />
				{ amount.toLocaleString() }
			</strong>
		);
	}
}

TwitchCheermote.propTypes = {
	amount: PropTypes.number,
	color: PropTypes.string,
	colorBlindness: PropTypes.number,
	enableDarkMode: PropTypes.bool,
	images: PropTypes.object,
	onLoad: PropTypes.func,
	showTwitchCheers: PropTypes.number,
	text: PropTypes.string
};

export default connect(({
	appConfig: {
		colorBlindness,
		enableDarkMode,
		showTwitchCheers
	}
}) => ({
	colorBlindness,
	enableDarkMode,
	showTwitchCheers
}))(TwitchCheermote);
