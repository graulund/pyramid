import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import { fixColorContrast } from "../../lib/color";

import UserLink from "../../components/UserLink.jsx";

class ChatUsername extends PureComponent {
	render() {
		const {
			className: givenClassName = "",
			color,
			colorBlindness,
			displayName,
			enableDarkMode,
			serverName,
			symbol = "",
			username
		} = this.props;

		var className = "chatusername " + givenClassName;

		const styles = {};

		// Numbered color

		if (color && typeof color === "number" && color > 0) {
			className += " chatusername--color-" + color;
		}

		// String color

		if (color && typeof color === "string") {
			let fixedColors = fixColorContrast(color, colorBlindness);
			styles.color = enableDarkMode ? fixedColors.dark : fixedColors.light;
		}

		return (
			<strong className={className} style={styles}>
				{ symbol }
				<UserLink
					username={username}
					displayName={displayName}
					serverName={serverName}
					key={username} />
			</strong>
		);
	}
}

ChatUsername.propTypes = {
	color: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	colorBlindness: PropTypes.number,
	className: PropTypes.string,
	displayName: PropTypes.string,
	enableDarkMode: PropTypes.bool,
	serverName: PropTypes.string,
	symbol: PropTypes.string,
	username: PropTypes.string.isRequired
};

export default ChatUsername;
