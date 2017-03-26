import React, { PureComponent, PropTypes } from "react";
import { Link } from "react-router";
import moment from "moment";
import "intersection-observer";

import ChannelLink from "../components/ChannelLink.jsx";
import ChatBunchedEventsLine from "./ChatBunchedEventsLine.jsx";
import ChatLines from "./ChatLines.jsx";
import ChatMessageLine from "./ChatMessageLine.jsx";
import ChatUserEventLine from "./ChatUserEventLine.jsx";
import { channelUrl } from "../lib/routeHelpers";

class ChatLine extends PureComponent {
	constructor(props) {
		super(props);

		this.toggleContext = this.toggleContext.bind(this);

		this.state = {
			afterObserver: null,
			beforeObserver: null,
			showContext: false
		};
	}

	componentDidUpdate(prevProps, prevState) {
		const { showContext } = this.state;
		const { showContext: prevShowContext } = prevState;

		if (!prevShowContext && showContext) {
			this.initializeExpandedView();
		}
		else if (prevShowContext && !showContext) {
			this.destroyExpandedView();
		}
	}

	componentWillUnmount() {
		this.destroyExpandedView();
	}

	initializeExpandedView() {
		const { after: afterEl, afterEdge, before: beforeEl, beforeEdge } = this.refs;
		const { afterObserver, beforeObserver } = this.state;

		if (beforeEl) {
			// Scroll to the bottom in the "before" view on initial render
			// TODO: Same after image render?
			beforeEl.scrollTop = beforeEl.children[0].offsetHeight;
		}

		if (!afterObserver && !beforeObserver) {
			const createCallback = (el, prefix) => {
				return (entries) => {
					const entry = entries[0];
					const { intersectionRatio } = entry;
					const edgedClass = `${prefix}--edged`;
					if (intersectionRatio >= 1) {
						el.classList.add(edgedClass);
					}
					else {
						el.classList.remove(edgedClass);
					}
				};
			};

			const beforeCallback = createCallback(beforeEl, "line__context-before");
			const afterCallback = createCallback(afterEl, "line__context-after");

			// Create intersection observer
			const beforeObserver = new IntersectionObserver(
				beforeCallback, { root: beforeEl }
			);
			const afterObserver = new IntersectionObserver(
				afterCallback, { root: afterEl }
			);

			beforeObserver.observe(beforeEdge);
			afterObserver.observe(afterEdge);

			this.setState({ afterObserver, beforeObserver });
		}
	}

	destroyExpandedView() {
		// Destroy intersection observer
		const { afterObserver, beforeObserver } = this.state;

		if (afterObserver) {
			afterObserver.disconnect();
		}

		if (beforeObserver) {
			beforeObserver.disconnect();
		}

		this.setState({ afterObserver: null, beforeObserver: null });
	}

	toggleContext() {
		this.setState({ showContext: !this.state.showContext });
	}

	render() {
		const {
			channel,
			contextMessages,
			displayChannel,
			displayContextLink = false,
			displayUsername,
			highlight,
			lineId,
			time,
			type
		} = this.props;

		const { showContext } = this.state;

		const m = moment(time);
		const timestamp = m.format("H:mm:ss");
		const datestamp = m.format("YYYY-MM-DD");

		const isHighlight = !!(highlight && highlight.length);
		const className = "line" +
			(isHighlight ? " line--highlight" : "") +
			(showContext ? " line--with-context": "");

		var content = null;

		switch (type) {
			case "msg":
			case "action":
				content = <ChatMessageLine {...this.props} key="content" />;
				break;
			case "join":
			case "part":
			case "quit":
			case "kick":
			case "kill":
			case "+mode":
			case "-mode":
				content = <ChatUserEventLine {...this.props} key="content" />;
				break;
			case "events":
				content = <ChatBunchedEventsLine {...this.props} key="content" />;
				break;
		}

		if (!content) {
			content = <em>{ `no template for \`${type}\` event` }</em>;
		}

		var channelEl = null, contextLinkEl = null;

		if (displayChannel) {
			channelEl = (
				<span className="line__channel">
					<ChannelLink channel={channel} key={channel} />
					{" "}
				</span>
			);
		}

		if (displayContextLink) {
			contextLinkEl = (
				<a className="line__context" href="javascript://" onClick={this.toggleContext}>
					Context
				</a>
			);
		}

		// Render context
		var contextBefore = null, contextAfter = null, header = null;

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

			header = (
				<div className="line__header">
					<strong>Expanded view</strong>
					<span className="line__context">
						<Link to={`${channelUrl(channel)}#line-${lineId}`}>
							Full context
						</Link>{" "}
						<a href="javascript://" onClick={this.toggleContext}>
							Close
						</a>
					</span>
				</div>
			);

			contextLinkEl = null;

			if (before.length) {
				contextBefore = (
					<div className="line__context-before line__context-before--edged" ref="before">
						<ChatLines
							messages={before}
							displayChannel={displayChannel}
							displayUsername={displayUsername}
							displayFirstDate={false} />
						<div key="before-edge" ref="beforeEdge" />
					</div>
				);
			}

			if (after.length) {
				contextAfter = (
					<div className="line__context-after line__context-after--edged" ref="after">
						<div key="after-edge" ref="afterEdge" />
						<ChatLines
							messages={after}
							displayChannel={displayChannel}
							displayUsername={displayUsername}
							displayFirstDate={false} />
					</div>
				);
			}
		}

		return (
			<li id={`line-${lineId}`} className={className}>
				{ header }
				{ contextBefore }
				{ contextLinkEl }
				{ channelEl }
				<time dateTime={time} title={datestamp + " " + timestamp}>
					{ timestamp }
				</time>{" "}
				{ content }
				{ contextAfter }
			</li>
		);
	}
}

ChatLine.propTypes = {
	argument: PropTypes.string,
	by: PropTypes.string,
	channel: PropTypes.string,
	channelName: PropTypes.string,
	color: PropTypes.number,
	contextMessages: PropTypes.array,
	displayChannel: PropTypes.bool,
	displayContextLink: PropTypes.bool,
	displayUsername: PropTypes.bool,
	events: PropTypes.array,
	highlight: PropTypes.array,
	isAction: PropTypes.bool,
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

export default ChatLine;
