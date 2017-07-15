import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import { subjectUrl } from "../lib/routeHelpers";

// ChatViewLink: We're opening in the frame currently in focus if in multi chat view

class ChatViewLink extends PureComponent {
	render() {
		const {
			children,
			className,
			currentLayout,
			currentLayoutFocus,
			query,
			type
		} = this.props;

		/*const uriData = parseChannelUri(channel);
		const conversationData = uriData && getConversationData(uriData);
		var url;

		if (conversationData) {
			let { username, server } = conversationData;
			url = conversationUrl(server, username);
		}

		else {
			url = channelUrl(channel);
		}*/

		if (currentLayout && currentLayout.length) {
			return (
				<a className={className} onClick={this.navigateInLayout}>
					{ children }
				</a>
			);
		}

		let url = subjectUrl(type, query);

		return (
			<Link className={className} to={url}>
				{ children }
			</Link>
		);
	}
}

ChatViewLink.propTypes = {
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
	currentLayout: PropTypes.array,
	currentLayoutFocus: PropTypes.number,
	query: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired
};

export default connect(({
	viewState: { currentLayout, currentLayoutFocus }
}) => ({
	currentLayout, currentLayoutFocus
}))(ChatViewLink);
