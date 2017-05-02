import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import throttle from "lodash/throttle";

import ChatLines from "./ChatLines.jsx";
import { channelUrl, createLineIdHash } from "../lib/routeHelpers";

const block = "contextview";

const BORDER_PIXELS = 2;

class ChatContextView extends PureComponent {
	constructor(props) {
		super(props);

		this.handleScroll = throttle(this.handleScroll.bind(this), 50);
		this.initializeExpandedView = this.initializeExpandedView.bind(this);
		this.toggleContext = this.toggleContext.bind(this);

		this.state = {
			scrolled: false,
			showContext: false
		};
	}

	componentDidUpdate(prevProps, prevState) {
		const { showContext } = this.state;
		const { showContext: prevShowContext } = prevState;

		if (!prevShowContext && showContext) {
			this.initializeExpandedView();
		}
	}

	handleScroll() {
		const { scrolled } = this.state;

		if (!scrolled) {
			this.setState({ scrolled: true });
		}
	}

	initializeExpandedView() {
		const { lineId } = this.props;
		const { scrolled } = this.state;
		const { main } = this.refs;

		if (main && !scrolled) {
			const line = main.querySelector(createLineIdHash(lineId));

			if (line) {
				const lineTop = line.offsetTop;
				const mainTop = main.offsetTop;
				const lineHeight = line.offsetHeight;
				const mainHeight = main.offsetHeight;

				main.scrollTop = (lineTop - mainTop)
					- (mainHeight - BORDER_PIXELS) / 2
					+ lineHeight / 2;
			}
		}
	}

	toggleContext() {
		const { showContext } = this.state;

		if (!showContext) {
			// Reset scrolled value when opening
			this.setState({ scrolled: false, showContext: !showContext });
		}
		else {
			this.setState({ showContext: !showContext });
		}
	}

	render() {
		const {
			channel,
			contextMessages,
			displayChannel,
			displayUsername,
			highlight,
			lineId,
			observer,
			time
		} = this.props;

		const { showContext } = this.state;

		const isHighlight = !!(highlight && highlight.length);
		const className = block +
			(isHighlight ? ` ${block}--highlight` : "") +
			(showContext ? ` ${block}--with-context` : "");

		const lineEl = <ChatLines
			messages={[this.props]}
			observer={observer}
			onEmoteLoad={this.initializeExpandedView}
			displayChannel={displayChannel}
			displayUsername={displayUsername}
			displayFirstDate={false}
			key="content" />;

		const contextLinkEl = (
			<a className={`${block}__options`}
				href="javascript://"
				onClick={this.toggleContext}
				key="showContext">
				Context
			</a>
		);

		var content = null;

		if (showContext && contextMessages) {
			const before = [], after = [];
			contextMessages.forEach((msg) => {
				if (msg) {
					if (msg.time <= time) {
						before.push(msg);
					}
					else {
						after.push(msg);
					}
				}
			});

			const allMessages = before.concat([this.props]).concat(after);

			const fullUrl = channelUrl(channel) + createLineIdHash(lineId);

			const header = (
				<div className={`${block}__header`} key="header">
					<strong>Expanded view</strong>
					<span className={`${block}__options`}>
						<Link to={fullUrl}
							key="showFullContext">
							Full context
						</Link>{" "}
						<a href="javascript://"
							onClick={this.toggleContext}
							key="closeContext">
							Close
						</a>
					</span>
				</div>
			);

			const context = (
				<div className={`${block}__main`} key="main" ref="main">
					<ChatLines
						messages={allMessages}
						observer={observer}
						displayChannel={displayChannel}
						displayUsername={displayUsername}
						displayFirstDate={false} />
				</div>
			);

			content = [header, context];
		}
		else {
			content = [contextLinkEl, lineEl];
		}

		const itemProps = {
			className,
			id: `line-${lineId}`
		};

		return <li {...itemProps}>{ content }</li>;
	}
}

ChatContextView.propTypes = {
	argument: PropTypes.string,
	by: PropTypes.string,
	channel: PropTypes.string,
	channelName: PropTypes.string,
	color: PropTypes.number,
	contextMessages: PropTypes.array,
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	events: PropTypes.array,
	highlight: PropTypes.array,
	lineId: PropTypes.string,
	message: PropTypes.string,
	mode: PropTypes.string,
	observer: PropTypes.object,
	reason: PropTypes.string,
	server: PropTypes.string,
	symbol: PropTypes.string,
	tags: PropTypes.object,
	time: PropTypes.string,
	type: PropTypes.string,
	username: PropTypes.string
};

export default ChatContextView;
