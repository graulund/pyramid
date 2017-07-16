import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChatViewLink from "./ChatViewLink.jsx";
import { CATEGORY_NAMES, PAGE_TYPES } from "../constants";

const block = "highlightslink";

class HighlightsLink extends PureComponent {
	render() {
		const {
			className: givenClassName,
			noText = false,
			unseenHighlights
		} = this.props;

		var badge = null;

		if (unseenHighlights && unseenHighlights.length) {
			badge = (
				<strong className="badge" key="badge">
					{ unseenHighlights.length }
				</strong>
			);
		}

		let className = block +
			(badge ? ` ${block}--highlighted` : "") +
			(givenClassName ? " " + givenClassName : "");

		if (noText) {
			if (badge) {
				return (
					<ChatViewLink
						type={PAGE_TYPES.CATEGORY}
						query="highlights"
						className={className}>
						{ badge }
					</ChatViewLink>
				);
			}

			return null;
		}

		return (
			<ChatViewLink
				type={PAGE_TYPES.CATEGORY}
				query="highlights"
				className={className}>
				<span key="text">{ CATEGORY_NAMES.highlights }</span>
				{ badge }
			</ChatViewLink>
		);
	}
}

HighlightsLink.propTypes = {
	className: PropTypes.string,
	noText: PropTypes.bool,
	unseenHighlights: PropTypes.array
};

export default connect(({
	unseenHighlights
}) => ({
	unseenHighlights
}))(HighlightsLink);
