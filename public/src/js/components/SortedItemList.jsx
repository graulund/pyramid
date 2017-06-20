import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { List } from "react-virtualized";

import { ITEM_LIST_ITEM_HEIGHT } from "../constants";
import { minuteTime } from "../lib/formatting";

const defaultLastSeenData = { time: "" };

class SortedItemList extends PureComponent {
	constructor(props) {
		super(props);

		this.activitySort = this.activitySort.bind(this);
		this.alphaSort = this.alphaSort.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.renderItem = this.renderItem.bind(this);

		this.currentSortedNames = null;

		this.state = {
			sortLocked: false
		};
	}

	componentWillReceiveProps(newProps) {
		if (newProps.sort !== this.props.sort) {
			this.setState({ sortLocked: false });
		}
	}

	onMouseEnter() {
		this.setState({ sortLocked: true });
	}

	onMouseLeave() {
		this.setState({ sortLocked: false });
	}

	alphaSort(a, b) {
		let { sortableNameForItem } = this.props;

		if (a && b) {
			return sortableNameForItem(a).localeCompare(
				sortableNameForItem(b)
			);
		}

		return -1;
	}

	activitySort(a, b) {
		if (a && b) {
			let aLastSeen = a.lastSeen || defaultLastSeenData;
			let bLastSeen = b.lastSeen || defaultLastSeenData;
			var sort = -1 * minuteTime(aLastSeen.time)
				.localeCompare(minuteTime(bLastSeen.time));

			if (sort === 0) {
				// Sort by channel name as a backup
				return this.alphaSort(a, b);
			}

			return sort;
		}
		return 1;
	}

	renderItem(request, list) {
		let { index } = request;
		let { renderItem } = this.props;
		let data = list[index];

		return renderItem(data, request);
	}

	render() {
		let {
			getIdForItem,
			height,
			id,
			list,
			noItemsText = "Nothing here :(",
			sort,
			width
		} = this.props;

		let { sortLocked } = this.state;

		if (!width || !height) {
			return null;
		}

		let displayedList = list;

		// Sorting

		if (
			sortLocked &&
			this.currentSortedNames &&
			this.currentSortedNames.length
		) {
			let out = [...this.currentSortedNames];
			list.forEach((item) => {
				let index = out.indexOf(getIdForItem(item));
				if (index >= 0) {
					out[index] = item;
				}

				else {
					// Didn't exist, just push it
					out.push(item);
				}
			});

			// Remove unreplaced strings
			for (var i = out.length - 1; i >= 0; i--) {
				if (typeof out[i] === "string") {
					out.splice(i, 1);
				}
			}

			displayedList = out;
		}

		else {
			if (sort === "activity") {
				// Sorting by last activity
				list.sort(this.activitySort);
			} else {
				// Sorting by channel name
				list.sort(this.alphaSort);
			}

			this.currentSortedNames = list.map(
				(item) => getIdForItem(item)
			);
		}

		// Rendering

		var renderedItems;
		if (displayedList.length) {
			// We always want to create a new instance of this, so it re-renders fully
			let itemRenderer = (request) => this.renderItem(request, displayedList);

			renderedItems = (
				<List
					height={height}
					rowCount={list.length}
					rowHeight={ITEM_LIST_ITEM_HEIGHT}
					rowRenderer={itemRenderer}
					width={width} />
			);
		}
		else {
			renderedItems = [
				<div className="nothing" key="nothing">{ noItemsText }</div>
			];
		}

		return (
			<div
				id={id}
				className="itemlist"
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}>
				{ renderedItems }
			</div>
		);
	}
}

SortedItemList.propTypes = {
	getIdForItem: PropTypes.func.isRequired,
	height: PropTypes.number.isRequired,
	id: PropTypes.string,
	list: PropTypes.array.isRequired,
	noItemsText: PropTypes.string,
	renderItem: PropTypes.func.isRequired,
	sort: PropTypes.string,
	sortableNameForItem: PropTypes.func.isRequired,
	width: PropTypes.number.isRequired
};

export default SortedItemList;
