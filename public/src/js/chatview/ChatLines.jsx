import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { CellMeasurer, CellMeasurerCache, List, WindowScroller } from "react-virtualized";

import ChatLine from "./ChatLine.jsx";
import { humanDateStamp } from "../lib/formatting";

const block = "chatlines";

class ChatLines extends PureComponent {
	constructor(props) {
		super(props);

		this.renderItem = this.renderItem.bind(this);

		this.cellMeasurerCache = new CellMeasurerCache({
			defaultHeight: 21,
			minHeight: 21,
			fixedWidth: true
		});
	}

	renderDateHeader(dateString, key, style) {
		if (!this.dateHeaderCache) {
			this.dateHeaderCache = {};
		}

		let cachedEl = this.dateHeaderCache[dateString];

		if (cachedEl) {
			return cachedEl;
		}

		let out = (
			<div
				className="date-header"
				key={key || dateString}
				style={style}>
				<span>{ dateString }</span>
			</div>
		);

		this.dateHeaderCache[dateString] = out;

		return out;
	}

	renderItem(content, request) {
		let { index, key, parent } = request;

		if (!content) {
			return null;
		}

		return (
			<CellMeasurer
				cache={this.cellMeasurerCache}
				columnIndex={0}
				key={key}
				rowIndex={index}
				parent={parent}>
				{ content }
			</CellMeasurer>
		);
	}

	render() {
		const {
			collapseJoinParts,
			displayChannel,
			displayContextLink,
			displayFirstDate = true,
			displayUsername,
			loading,
			messages,
			observer,
			onEmoteLoad
		} = this.props;

		var content = null;

		if (messages && messages.length) {
			var lastDateString = "";

			let contentList = [];

			messages.forEach((msg, index) => {
				if (msg) {
					var dateString = humanDateStamp(new Date(msg.time), true, true);
					var line = (key, style) => {
						return ({ measure }) => {
							let m = () => {
								if (typeof measure === "function") {
									measure();
								}
								if (typeof onEmoteLoad === "function") {
									onEmoteLoad();
								}
							};

							return (
								<ChatLine
									{...msg}
									collapseJoinParts={collapseJoinParts}
									displayChannel={displayChannel}
									displayContextLink={displayContextLink}
									displayUsername={displayUsername}
									observer={observer}
									onEmoteLoad={m}
									style={style}
									key={key || msg.lineId || index} />
							);
						};
					};

					// Detect date change
					if (dateString !== lastDateString) {

						// Insert date header
						if (displayFirstDate || lastDateString !== "") {
							lastDateString = dateString;
							contentList.push(
								(key, style) =>
									this.renderDateHeader(dateString, key, style)
							);
						}

						else {
							lastDateString = dateString;
						}
					}

					contentList.push(line);
				}
			});

			let itemRenderer = (request) => {
				let { index, key, style } = request;
				let content = contentList[index](key, style);
				return this.renderItem(content, request);
			};

			content = (
				<WindowScroller>
					{ ({ height, isScrolling, onChildScroll, scrollTop }) => (
						<List
							autoHeight
							deferredMeasurementCache={this.cellMeasurerCache}
							height={height}
							isScrolling={isScrolling}
							onScroll={onChildScroll}
							rowCount={contentList.length}
							rowHeight={this.cellMeasurerCache.rowHeight}
							rowRenderer={itemRenderer}
							scrollTop={scrollTop}
							width={window.innerWidth - 320}
						/>
					) }
				</WindowScroller>
			);
		}

		else if (!loading) {
			content = <div className={`${block}__empty`} key="empty">Nothing here :(</div>;
		}

		const className = block +
			(displayContextLink ? ` ${block}--with-context` : "");

		return <div className={className}>{ content }</div>;
	}
}

ChatLines.propTypes = {
	collapseJoinParts: PropTypes.bool,
	displayChannel: PropTypes.bool,
	displayContextLink: PropTypes.bool,
	displayFirstDate: PropTypes.bool,
	displayUsername: PropTypes.bool,
	loading: PropTypes.bool,
	messages: PropTypes.array,
	observer: PropTypes.object,
	onEmoteLoad: PropTypes.func
};

export default ChatLines;
