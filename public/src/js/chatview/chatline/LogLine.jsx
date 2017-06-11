import React, { PureComponent } from "react";
import PropTypes from "prop-types";

const block = "logline";
const prefixClassName = `${block}__prefix`;

class LogLine extends PureComponent {
	render() {
		const { level, message, server } = this.props;

		const className = block +
			(level ? ` ${block}--${level}` : "");

		var content = message;

		var prefix;

		if (server) {
			prefix = (
				<strong className={prefixClassName} key="prefix">
					<em>{ server }</em>
				</strong>
			);
		}
		else {
			prefix = (
				<strong className={prefixClassName} key="prefix">
					System
				</strong>
			);
		}

		return (
			<span className={className}>
				{ prefix }
				{ " " }
				{ content }
			</span>
		);
	}
}

LogLine.propTypes = {
	level: PropTypes.string,
	lineId: PropTypes.string,
	message: PropTypes.string.isRequired,
	server: PropTypes.string,
	time: PropTypes.string,
	type: PropTypes.string
};

export default LogLine;
