import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

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
			let fixedColor = fixColorContrast(color, colorBlindness);
			styles.color = enableDarkMode ? fixedColor.dark : fixedColor.light;
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
	color: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	colorBlindness: PropTypes.number,
	className: PropTypes.string,
	displayName: PropTypes.string,
	enableDarkMode: PropTypes.bool,
	symbol: PropTypes.string,
	username: PropTypes.string.isRequired
};

export default connect(({
	appConfig: { colorBlindness, enableDarkMode }
}) => ({
	colorBlindness,
	enableDarkMode
}))(ChatUsername);
