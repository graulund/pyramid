import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import { locationIsMultiChat, setViewInCurrent } from "../lib/multiChat";
import { subjectUrl } from "../lib/routeHelpers";

// ChatViewLink: We're opening in the frame currently in focus if in multi chat view

class ChatViewLink extends PureComponent {
	constructor(props) {
		super(props);
		this.onClick = this.onClick.bind(this);
	}

	onClick(evt) {
		let { date, pageNumber, query, type } = this.props;

		if (
			locationIsMultiChat(location) &&
			setViewInCurrent(type, query, date, pageNumber)
		) {
			evt.preventDefault();
		}
	}

	render() {
		let {
			children,
			date,
			pageNumber,
			query,
			type,
			...props
		} = this.props;

		let url = subjectUrl(type, query, date, pageNumber);

		return (
			<Link {...props} to={url} onClick={this.onClick}>
				{ children }
			</Link>
		);
	}
}

ChatViewLink.propTypes = {
	children: PropTypes.node.isRequired,
	date: PropTypes.string,
	pageNumber: PropTypes.number,
	query: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired
};

export default ChatViewLink;
