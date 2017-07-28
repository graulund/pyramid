import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import * as multiChat from "../lib/multiChat";
import { refElSetter } from "../lib/refEls";
import { homeUrl, subjectUrl } from "../lib/routeHelpers";

class ChatWindowMenu extends PureComponent {
	constructor(props) {
		super(props);

		this.closeWindowMenu = this.closeWindowMenu.bind(this);
		this.toggleWindowMenu = this.toggleWindowMenu.bind(this);
		this.addFrameToTheLeft = this.addFrameToTheLeft.bind(this);
		this.addFrameToTheRight = this.addFrameToTheRight.bind(this);
		this.addFrameAbove = this.addFrameAbove.bind(this);
		this.addFrameBelow = this.addFrameBelow.bind(this);
		this.removeFrame = this.removeFrame.bind(this);
		this.removeOtherFrames = this.removeOtherFrames.bind(this);

		this.els = {};
		this.setControl = refElSetter("control").bind(this);

		this.state = {
			open: false
		};
	}

	componentDidMount() {
		let { control } = this.els;

		// Close the menu on outside and inside click
		this.closeClickHandler = (evt) => {
			if (
				evt.target === control ||
				evt.target.parentNode === control
			) {
				return;
			}

			this.closeWindowMenu();
		};
		document.addEventListener("click", this.closeClickHandler);
	}

	componentWillUnmount() {
		// Remove external close handler
		if (this.closeClickHandler) {
			document.removeEventListener("click", this.closeClickHandler);
		}
	}

	closeWindowMenu() {
		this.setState({ open: false });
	}

	toggleWindowMenu() {
		const { open } = this.state;
		this.setState({ open: !open });
	}

	isShowingLayout() {
		return location.pathname === homeUrl;
	}

	addFrame(func) {
		let { index, page = {} } = this.props;
		let { router } = this.context;

		func(index, page);

		if (!this.isShowingLayout()) {
			router.history.replace(homeUrl);
		}
	}

	addFrameToTheLeft() {
		this.addFrame(multiChat.addFrameToTheLeft);
	}

	addFrameToTheRight() {
		this.addFrame(multiChat.addFrameToTheRight);
	}

	addFrameAbove() {
		this.addFrame(multiChat.addFrameAbove);
	}

	addFrameBelow() {
		this.addFrame(multiChat.addFrameBelow);
	}

	removeFrame() {
		// TODO: Link
		let { index } = this.props;
		let newLayout = multiChat.removeFrame(index);

		if (newLayout.length === 1) {
			this.redirectToSingle(newLayout[0]);
		}
	}

	removeOtherFrames() {
		let { currentLayout, index } = this.props;
		let item = currentLayout[index];

		multiChat.clearCurrentLayout();
		this.redirectToSingle(item);
	}

	redirectToSingle(item) {
		let { router } = this.context;
		let { type, query, date, pageNumber } = item;

		if (type && query) {
			router.history.replace(subjectUrl(type, query, date, pageNumber));
		}
	}

	renderList(menu) {
		let out = [];

		menu.forEach((group) => {
			let newGroup = out.length > 0;

			group.forEach((item) => {
				let { action, name, qualifier } = item;

				if (qualifier) {
					let className = newGroup && "sep" || undefined;
					newGroup = false;

					out.push(
						<li className={className} key={name}>
							<a
								className="menu__link"
								href="javascript://"
								onClick={action}>
								{ name }
							</a>
						</li>
					);
				}
			});
		});

		return out;
	}

	render() {
		let { currentLayout, index = 0 } = this.props;
		let { open } = this.state;

		if (!this.isShowingLayout()) {
			// If we don't see it, it don't exist
			currentLayout = null;
		}

		let windowMenuStyles = open ? { display: "block" } : null;

		let controlClassName = "menu-opener" +
			(open ? " menu-opener--active" : "");

		let hasLayout = currentLayout && currentLayout.length;
		let item = currentLayout && currentLayout[index];

		let dimensions = multiChat.getCurrentDimensions();
		let maxDimensions = multiChat.maximumDimensionsForViewport();

		let notTooWide = dimensions.width < maxDimensions.width;
		let notTooTall = dimensions.height < maxDimensions.height;
		let isWide = item && item.columnEnd - item.columnStart > 0;
		let isTall = item && item.rowEnd - item.rowStart > 0;

		let canExpandLeft = notTooWide ||
			hasLayout && multiChat.hasEmptySpaceToTheLeft(index);

		let canExpandRight = notTooWide ||
			hasLayout && multiChat.hasEmptySpaceToTheRight(index);

		let canExpandUp = notTooTall ||
			hasLayout && multiChat.hasEmptySpaceAbove(index);

		let canExpandDown = notTooTall ||
			hasLayout && multiChat.hasEmptySpaceBelow(index);

		let menu = [
			// Groups
			[
				{
					name: "Close frame",
					action: this.removeFrame,
					qualifier: currentLayout && currentLayout.length > 1
				},
				{
					name: "Close all others",
					action: this.removeOtherFrames,
					qualifier: currentLayout && currentLayout.length > 1
				}
			],

			[
				{
					name: "New frame to the left",
					action: this.addFrameToTheLeft,
					qualifier: canExpandLeft
				},
				{
					name: "New frame to the right",
					action: this.addFrameToTheRight,
					qualifier: canExpandRight
				},
				{
					name: "New frame above",
					action: this.addFrameAbove,
					qualifier: canExpandUp
				},
				{
					name: "New frame below",
					action: this.addFrameBelow,
					qualifier: canExpandDown
				}
			],

			[
				{
					name: "Expand frame to the left",
					action: this.expandFrameToTheLeft,
					qualifier: hasLayout && canExpandLeft
				},
				{
					name: "Contract frame from the left",
					action: this.contractFrameFromTheLeft,
					qualifier: isWide
				},
				{
					name: "Expand frame to the right",
					action: this.expandFrameToTheRight,
					qualifier: hasLayout && canExpandRight
				},
				{
					name: "Contract frame from the right",
					action: this.contractFrameFromTheRight,
					qualifier: isWide
				},
				{
					name: "Expand frame above",
					action: this.expandFrameAbove,
					qualifier: hasLayout && canExpandUp
				},
				{
					name: "Contract frame above",
					action: this.contractFrameAbove,
					qualifier: isTall
				},
				{
					name: "Expand frame below",
					action: this.expandFrameBelow,
					qualifier: hasLayout && canExpandDown
				},
				{
					name: "Contract frame below",
					action: this.contractFrameBelow,
					qualifier: isTall
				}
			]
		];

		return (
			<div>
				<div className={controlClassName} key="control">
					<a
						href="javascript://"
						ref={this.setControl}
						onClick={this.toggleWindowMenu}
						title="Open window controls">
						<img
							src="/img/diamond.svg"
							width="16"
							height="16"
							alt="Window control" />
					</a>
				</div>
				<ul
					className="menu pop-menu chatview__window-menu"
					key="window-menu"
					style={windowMenuStyles}>
					{ this.renderList(menu) }
				</ul>
			</div>
		);
	}
}

ChatWindowMenu.propTypes = {
	currentLayout: PropTypes.array,
	currentLayoutFocus: PropTypes.number,
	index: PropTypes.number,
	page: PropTypes.object
};

ChatWindowMenu.contextTypes = {
	router: PropTypes.object
};

export default connect(({
	viewState: { currentLayout, currentLayoutFocus }
}) => ({
	currentLayout, currentLayoutFocus
}))(ChatWindowMenu);
