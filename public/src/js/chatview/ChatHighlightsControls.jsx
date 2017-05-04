import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { clearUnseenHighlights } from "../lib/io";

const onClick = function() { clearUnseenHighlights(); };

const ChatHighlightsControls = function(props) {
	const { unseenHighlights } = props;

	if (unseenHighlights && unseenHighlights.length) {
		return (
			<ul className="controls chatview__controls">
				<li key="clearunseen">
					<a href="javascript://"
						onClick={onClick}>
						Mark all as read
					</a>
				</li>
			</ul>
		);
	}

	return null;
};

ChatHighlightsControls.propTypes = {
	unseenHighlights: PropTypes.array
};

export default connect(({
	unseenHighlights
}) => ({
	unseenHighlights
}))(ChatHighlightsControls);
