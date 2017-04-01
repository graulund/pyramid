import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";

import UserLink from "../components/UserLink.jsx";

class ChatUsername extends PureComponent {
	render() {
		const { className: givenClassName = "", color, symbol = "", username } = this.props;

		var className = "chatusername " + givenClassName;

		const styles = {};

		// Numbered color
		if (color && typeof color === "number" && color > 0) {
			className += " chatusername--color-" + color;
		}

		// String color
		if (color && typeof color === "string") {
			styles.color = color;
		}

		return (
			<strong className={className} style={styles}>
				{ symbol }
				<UserLink userName={username} key={username} />
			</strong>
		);
	}
}

ChatUsername.propTypes = {
	color: PropTypes.string,
	className: PropTypes.string,
	enableDarkMode: PropTypes.bool,
	symbol: PropTypes.string,
	username: PropTypes.string.isRequired
};

export default connect(({ enableDarkMode }) => ({ enableDarkMode }))(ChatUsername);
