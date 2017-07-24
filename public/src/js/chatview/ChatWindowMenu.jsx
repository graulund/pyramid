import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import * as multiChat from "../lib/multiChat";
import { refElSetter } from "../lib/refEls";

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

	addFrameToTheLeft() {
		let { index } = this.props;
		multiChat.addFrameToTheLeft(index);
	}

	addFrameToTheRight() {
		let { index } = this.props;
		multiChat.addFrameToTheRight(index);
	}

	addFrameAbove() {
		let { index } = this.props;
		multiChat.addFrameAbove(index);
	}

	addFrameBelow() {
		let { index } = this.props;
		multiChat.addFrameBelow(index);
	}

	removeFrame() {
		// TODO: Link
		let { index } = this.props;
		multiChat.removeFrame(index);
	}

	renderList(menu) {
		let out = [];

		menu.forEach((group) => {
			let newGroup = true;

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

		let windowMenuStyles = open ? { display: "block" } : null;

		let controlClassName = "menu-opener" +
			(open ? " menu-opener--active" : "");

		let item = currentLayout[index];

		let dimensions = multiChat.getCurrentDimensions();
		let maxDimensions = multiChat.maximumDimensionsForViewport();

		// TODO: Update on resize
		// TODO: Breaks when there are empty spaces

		let notTooWide = dimensions.width < maxDimensions.width;
		let notTooTall = dimensions.height < maxDimensions.height;
		let isWide = item && item.columnEnd - item.columnStart > 0;
		let isTall = item && item.rowEnd - item.rowStart > 0;

		let menu = [
			// Groups
			[
				{
					name: "Close frame",
					action: this.removeFrame,
					qualifier: currentLayout.length > 1
				},
				{
					name: "Close all others",
					action: this.removeOtherFrames,
					qualifier: currentLayout.length > 1
				}
			],

			[
				{
					name: "New frame to the left",
					action: this.addFrameToTheLeft,
					qualifier: notTooWide
				},
				{
					name: "New frame to the right",
					action: this.addFrameToTheRight,
					qualifier: notTooWide
				},
				{
					name: "New frame above",
					action: this.addFrameAbove,
					qualifier: notTooTall
				},
				{
					name: "New frame below",
					action: this.addFrameBelow,
					qualifier: notTooTall
				}
			],

			[
				{
					name: "Expand frame to the left",
					action: this.expandFrameToTheLeft,
					qualifier: notTooWide
				},
				{
					name: "Contract frame from the left",
					action: this.contractFrameFromTheLeft,
					qualifier: isWide
				},
				{
					name: "Expand frame to the right",
					action: this.expandFrameToTheRight,
					qualifier: notTooWide
				},
				{
					name: "Contract frame from the right",
					action: this.contractFrameFromTheRight,
					qualifier: isWide
				},
				{
					name: "Expand frame above",
					action: this.expandFrameAbove,
					qualifier: notTooTall
				},
				{
					name: "Contract frame above",
					action: this.contractFrameAbove,
					qualifier: isTall
				},
				{
					name: "Expand frame below",
					action: this.expandFrameBelow,
					qualifier: notTooTall
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
	index: PropTypes.number
};

export default connect(({
	viewState: { currentLayout, currentLayoutFocus }
}) => ({
	currentLayout, currentLayoutFocus
}))(ChatWindowMenu);
