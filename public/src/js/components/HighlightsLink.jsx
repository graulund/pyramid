import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router";

import { CATEGORY_NAMES } from "../constants";
import { categoryUrl } from "../lib/routeHelpers";

class HighlightsLink extends PureComponent {
	render() {
		const { unseenHighlights } = this.props;

		var badge = null;

		if (unseenHighlights && unseenHighlights.length) {
			badge = (
				<strong className="badge" key="badge">
					{ unseenHighlights.length }
				</strong>
			);
		}

		const className = "sidebar__menu-link" +
			(badge ? " sidebar__menu-link--highlighted" : "");

		return (
			<Link to={categoryUrl("highlights")} className={className} key="main">
				<span key="text">{ CATEGORY_NAMES.highlights }</span>
				{ badge }
			</Link>
		);
	}
}

HighlightsLink.propTypes = {
	unseenHighlights: PropTypes.array
};

export default connect(({ unseenHighlights }) => ({ unseenHighlights }))(HighlightsLink);
