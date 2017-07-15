import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChatView from "./ChatView.jsx";
import NoChatView from "./NoChatView.jsx";

class MultiChatView extends PureComponent {
	constructor(props) {
		super(props);
		this.renderItem = this.renderItem.bind(this);
	}

	renderItem(data, index) {
		let { currentLayoutFocus } = this.props;
		let focus = currentLayoutFocus === index;

		let styles = [];
		let content;

		if (data) {
			let {
				columnEnd,
				columnStart,
				query,
				rowEnd,
				rowStart,
				type
			} = data;

			if (query && type) {
				content = (
					<ChatView
						pageType={type}
						pageQuery={query} />
				);
			}

			styles = {
				gridColumn: columnStart && columnEnd &&
					`${columnStart} / ${columnEnd}`,
				gridRow: rowStart && rowEnd &&
					`${rowStart} / ${rowEnd}`
			};
		}

		if (!content) {
			content = <NoChatView />;
		}

		let className = "multichat__item" +
			(focus ? " multichat__item--focus" : "");

		return (
			<div className={className} style={styles} key={index}>
				{ content }
			</div>
		);
	}

	render() {
		let { currentLayout } = this.props;

		if (!currentLayout || !currentLayout.length) {
			return <NoChatView />;
		}

		return (
			<div className="multichat">
				<div className="multichat__inner">
					{ currentLayout.map(this.renderItem) }
				</div>
			</div>
		);
	}
}

MultiChatView.propTypes = {
	currentLayout: PropTypes.array,
	currentLayoutFocus: PropTypes.number
};

export default connect(({
	viewState: { currentLayout, currentLayoutFocus }
}) => ({
	currentLayout, currentLayoutFocus
}))(MultiChatView);
