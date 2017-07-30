import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ChatView from "./ChatView.jsx";
import NoChatView from "./NoChatView.jsx";
import * as multiChat from "../lib/multiChat";

const focusPrev = function() {
	multiChat.shiftFocus(-1);
};

const focusNext = function() {
	multiChat.shiftFocus(1);
};

const repeatedArray = function(string, times) {
	let a = new Array(times);

	for (let i = 0; i < times; i++) {
		a[i] = string;
	}

	return a;
};

const fractionString = function(amount) {
	if (amount > 1) {
		return repeatedArray("1fr", amount).join(" ");
	}

	return undefined;
};

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
		let { currentLayout, currentLayoutFocus } = this.props;
		let focus = currentLayoutFocus === index;
		let content = null;

		if (!data) {
			return null;
		}

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

		let styles = {
			gridColumn: columnStart && columnEnd &&
				`${columnStart} / ${columnEnd}`,
			gridRow: rowStart && rowEnd &&
				`${rowStart} / ${rowEnd}`
		};

		let isTopLeftCorner = columnStart === 1 && rowStart === 1;

		if (!content) {
			content = <NoChatView index={index} />;
		}

		let className = "multichat__item" +
			(focus && currentLayout.length > 1
				? " multichat__item--focus" : "") +
			(isTopLeftCorner ? " multichat__item--top-left" : "");

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

		let { width, height } = multiChat.getCurrentDimensions();

		let styles = {
			gridTemplateColumns: fractionString(width),
			gridTemplateRows: fractionString(height)
		};

		return (
			<div className="multichat">
				<div className="multichat__inner" style={styles} key="inner">
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
