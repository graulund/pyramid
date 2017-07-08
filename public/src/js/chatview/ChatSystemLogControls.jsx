import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import TimeAgo from "react-timeago";

const suffixlessFormatter = function(value, unit, suffix, date, defaultFormatter) {
	return defaultFormatter(value, unit, suffix, date).replace(/\s+ago/, "");
};

const ChatSystemLogControls = function(props) {
	let { awakeTime: awakeTimeString } = props;

	if (awakeTimeString) {
		let awakeTime = new Date(awakeTimeString);
		let fullString = awakeTime.toString();

		return (
			<time dateTime={awakeTimeString} title={fullString}>
				Up for <TimeAgo
					date={awakeTime}
					formatter={suffixlessFormatter}
					component="span"
					title={fullString}
					/>
			</time>
		);
	}

	return null;
};

ChatSystemLogControls.propTypes = {
	awakeTime: PropTypes.string
};

export default connect(({
	systemInfo: { awakeTime }
}) => ({
	awakeTime
}))(ChatSystemLogControls);
