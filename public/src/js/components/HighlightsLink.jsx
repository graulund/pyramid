import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { CATEGORY_NAMES } from "../constants";
import { categoryUrl } from "../lib/routeHelpers";

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
					<Link to={categoryUrl("highlights")} className={className}>
						{ badge }
					</Link>
				);
			}

			return null;
		}

		return (
			<Link to={categoryUrl("highlights")} className={className}>
				<span key="text">{ CATEGORY_NAMES.highlights }</span>
				{ badge }
			</Link>
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
