import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import { TWITCH_DISPLAY_NAMES } from "../constants";
import { fixColorContrast } from "../lib/color";

import UserLink from "../components/UserLink.jsx";

class ChatUsername extends PureComponent {
	render() {
		const {
			className: givenClassName = "", color,
			enableDarkMode, enableTwitchDisplayNames,
			symbol = "", username
		} = this.props;

		var { displayName } = this.props;

		var className = "chatusername " + givenClassName;

		const styles = {};

		// Numbered color

		if (color && typeof color === "number" && color > 0) {
			className += " chatusername--color-" + color;
		}

		// String color

		if (color && typeof color === "string") {
			const fixedColor = fixColorContrast(color);
			styles.color = enableDarkMode ? fixedColor.dark : fixedColor.light;
		}

		// Prevent display name depending on settings

		if (
			displayName &&
			(
				!enableTwitchDisplayNames ||
				(
					enableTwitchDisplayNames < TWITCH_DISPLAY_NAMES.ALL &&
					displayName.toLowerCase() !== username.toLowerCase()
				)
			)
		) {
			displayName = null;
		}

		return (
			<strong className={className} style={styles}>
				{ symbol }
				<UserLink userName={username} displayName={displayName} key={username} />
			</strong>
		);
	}
}

ChatUsername.propTypes = {
	color: PropTypes.string,
	className: PropTypes.string,
	displayName: PropTypes.string,
	enableDarkMode: PropTypes.bool,
	enableTwitchDisplayNames: PropTypes.number,
	symbol: PropTypes.string,
	username: PropTypes.string.isRequired
};

export default connect(({
	appConfig: { enableDarkMode, enableTwitchDisplayNames }
}) => ({
	enableDarkMode,
	enableTwitchDisplayNames
}))(ChatUsername);
