import React from "react";
import PropTypes from "prop-types";

function ChatLinePrefix(props) {
	if (props.children) {
		return <div className="prefix">{ props.children }</div>;
	}

	return null;
}

ChatLinePrefix.propTypes = {
	children: PropTypes.node
};

export default ChatLinePrefix;
