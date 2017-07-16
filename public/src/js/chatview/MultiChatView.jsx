import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChatView from "./ChatView.jsx";
import NoChatView from "./NoChatView.jsx";
import * as multiChat from "../lib/multiChat";

const focusPrev = function() { multiChat.shiftFocus(-1); };
const focusNext = function() { multiChat.shiftFocus(+1); };

class MultiChatView extends PureComponent {
	constructor(props) {
		super(props);

		this.renderItem = this.renderItem.bind(this);

		this.setFocusHandlers = {};
	}

	createFocusHandler(index) {
		return () => multiChat.setFocus(index);
	}

	getFocusHandler(index) {
		// Cache the value change handlers so they don't change

		if (!this.setFocusHandlers[index]) {
			this.setFocusHandlers[index] = this.createFocusHandler(index);
		}

		return this.setFocusHandlers[index];
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
				logDate,
				pageNumber,
				query,
				rowEnd,
				rowStart,
				type
			} = data;

			if (query && type) {
				content = (
					<ChatView
						focus={focus}
						index={index}
						logDate={logDate}
						pageNumber={pageNumber}
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

		let onClick = this.getFocusHandler(index);

		return (
			<div
				className={className}
				style={styles}
				onClick={onClick}
				key={index}>
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
				<div className="multichat__inner" key="inner">
					{ currentLayout.map(this.renderItem) }
				</div>
				<div className="accesskeys" key="accesskeys">
					<a
						href="javascript://"
						accessKey=","
						onClick={focusPrev}
						key="prev">Previous</a>
					<a
						href="javascript://"
						accessKey="."
						onClick={focusNext}
						key="next">Next</a>
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
