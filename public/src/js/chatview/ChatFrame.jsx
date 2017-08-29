import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import remove from "lodash/remove";
import throttle from "lodash/throttle";
import values from "lodash/values";
import "intersection-observer";

import ChannelUserList from "./ChannelUserList.jsx";
import ChatLines from "./ChatLines.jsx";
import { CHANNEL_TYPES, PAGE_TYPES, PAGE_TYPE_NAMES } from "../constants";
import { parseChannelUri } from "../lib/channelNames";
import {
	reportConversationAsSeenIfNeeded, setConversationAsOpen, setConversationAsClosed
} from "../lib/conversations";
import { reportHighlightAsSeen } from "../lib/io";
import { refElSetter } from "../lib/refEls";
import {
	areWeScrolledToTheBottom, scrollToTheBottom, scrollToTheTop
} from "../lib/scrolling";

const FLASHING_LINE_CLASS_NAME = "flashing";

class ChatFrame extends PureComponent {
	constructor(props) {
		super(props);

		this.lineObserverCallback = this.lineObserverCallback.bind(this);
		this.onObserve = this.onObserve.bind(this);
		this.onUnobserve = this.onUnobserve.bind(this);
		this.scrollIfNeeded = this.scrollIfNeeded.bind(this);

		this.handleResize = throttle(this.scrollIfNeeded, 100);

		this.observerHandlers = {
			observe: this.onObserve,
			unobserve: this.onUnobserve
		};

		this.els = {};
		this.setPrimaryFrameEl = refElSetter("primaryFrame").bind(this);
		this.setRoot = refElSetter("root").bind(this);

		this.atBottom = true;

		this.setUriData(props);
		this.clearObserver();
	}

	componentDidMount() {
		let { lines, logDate } = this.props;

		if (lines && lines.length && !logDate && this.els.primaryFrame) {
			scrollToTheBottom(this.els.primaryFrame);
		}

		this.setConversationAsOpen();

		window.addEventListener("resize", this.handleResize);
	}

	componentWillReceiveProps(newProps) {
		const {
			lines,
			logDate,
			pageQuery,
			pageType
		} = newProps;

		const {
			lines: oldLines,
			logDate: oldLogDate,
			pageQuery: oldQuery,
			pageType: oldType
		} = this.props;

		// Lines change

		if (
			lines !== oldLines &&
			pageQuery === oldQuery &&
			pageType === oldType &&
			logDate === oldLogDate
		) {
			this.atBottom = areWeScrolledToTheBottom(this.els.primaryFrame);
		}
	}

	componentDidUpdate(oldProps) {
		const {
			connectionStatus,
			currentLayout,
			inFocus,
			lines,
			logBrowserOpen,
			logDate,
			offlineMessages,
			pageQuery,
			pageType,
			selectedLine,
			userListOpen
		} = this.props;

		const {
			connectionStatus: oldConnectionStatus,
			currentLayout: oldLayout,
			inFocus: oldInFocus,
			lines: oldLines,
			logDate: oldLogDate,
			logBrowserOpen: oldLogBrowserOpen,
			offlineMessages: oldOfflineMessages,
			pageQuery: oldQuery,
			pageType: oldType,
			selectedLine: oldSelectedLine,
			userListOpen: oldUserListOpen
		} = oldProps;

		// Page changed

		let pageChanged = (
			pageQuery !== oldQuery ||
			pageType !== oldType ||
			logDate !== oldLogDate
		);

		if (pageChanged) {
			this.setConversationAsClosed(this.uriData);
			this.setUriData();
			this.setConversationAsOpen();
			this.clearObserver();
		}

		// Lines changed

		if (lines !== oldLines || offlineMessages !== oldOfflineMessages) {
			if (logDate) {
				scrollToTheTop(this.els.primaryFrame);
			}
			else if (this.atBottom || pageChanged) {
				scrollToTheBottom(this.els.primaryFrame);
			}

			if (inFocus) {
				this.reportConversationAsSeen();
			}
		}

		// Layout changed

		if (
			this.atBottom &&
			(
				(userListOpen && !oldUserListOpen) ||
				connectionStatus !== oldConnectionStatus ||
				currentLayout !== oldLayout
			)
		) {
			scrollToTheBottom(this.els.primaryFrame);
		}

		// Log browser opened

		if (
			logBrowserOpen !== oldLogBrowserOpen
		) {
			this.resetObserver();
		}

		// Are we querying a specific line id

		if (selectedLine && selectedLine !== oldSelectedLine) {
			this.flashLine(selectedLine.lineId);
		}

		// Focus changed
		if (inFocus && !oldInFocus) {
			this.handleBackInFocus();
		}
	}

	componentWillUnmount() {
		this.setConversationAsClosed();
		window.removeEventListener("resize", this.handleResize);
	}

	isLiveChannel(props = this.props) {
		const { logDate, pageType } = props;
		return pageType === PAGE_TYPES.CHANNEL && !logDate;
	}

	scrollIfNeeded() {
		let { logDate } = this.props;
		if (!logDate && this.atBottom) {
			scrollToTheBottom(this.els.primaryFrame);
		}
	}

	// Observers

	getObserver (props = this.props) {
		const { logBrowserOpen, logDate } = props;
		const isLiveChannel = this.isLiveChannel(props);

		// Acknowledge that there's an overlay when we're viewing a live channel, coming from the input

		var topMargin = -40, bottomMargin = 0;

		if (isLiveChannel) {
			bottomMargin = -80;
		}

		if (logBrowserOpen || logDate) {
			topMargin = -70;
		}

		const rootMargin = topMargin + "px 0px " +
			bottomMargin + "px 0px";

		var intersectionObserverOptions = {
			root: null,
			rootMargin,
			threshold: 1.0
		};

		return new IntersectionObserver(
			this.lineObserverCallback,
			intersectionObserverOptions
		);
	}

	setObserver (props = this.props) {
		this.observer = this.getObserver(props);
	}

	clearObserver(props = this.props) {
		if (this.observer) {
			this.observer.disconnect();
		}

		this.setObserver(props);

		// Do NOT carry old ones over
		this.observed = [];
		this.currentlyVisible = [];
	}

	resetObserver (props = this.props) {
		if (this.observer) {
			this.observer.disconnect();
		}

		this.setObserver(props);

		// Carry old ones over
		this.observed.forEach((el) => {
			this.observer.observe(el);
		});
		this.currentlyVisible = [];
	}

	onObserve(el) {
		if (el && this.observer) {
			this.observer.observe(el);
			this.observed.push(el);
		}
	}

	onUnobserve(el) {
		if (el) {
			if (this.observer) {
				this.observer.unobserve(el);
			}
			remove(this.observed, (item) => item === el);
		}
	}

	reportElementAsSeen(el) {
		reportHighlightAsSeen(el.lineId);
		this.onUnobserve(el);

		if (el.onUnobserve) {
			el.onUnobserve();
		}
	}

	lineObserverCallback(entries) {
		const { inFocus } = this.props;
		entries.forEach((entry) => {
			if (
				entry &&
				entry.target &&
				entry.target.lineId &&
				this.observed.indexOf(entry.target) >= 0
			) {
				const el = entry.target;
				if (entry.intersectionRatio >= 1) {
					// Currently visible
					if (inFocus) {
						this.reportElementAsSeen(el);
					}
					else if (this.currentlyVisible.indexOf(el) < 0) {
						this.currentlyVisible.push(el);
					}
				}
				else {
					// No longer visible
					if (this.currentlyVisible.indexOf(el) >= 0) {
						remove(this.currentlyVisible, (item) => item === el);
					}
				}
			}
		});
	}

	handleBackInFocus() {
		this.currentlyVisible.forEach((el) => {
			this.reportElementAsSeen(el);
		});
		this.currentlyVisible = [];
		this.reportConversationAsSeen();
	}

	setUriData(props = this.props) {
		let { pageType, pageQuery } = props;
		let uriData = null;

		if (pageType === PAGE_TYPES.CHANNEL && pageQuery) {
			uriData = parseChannelUri(pageQuery);
		}

		this.uriData = uriData;
	}

	reportConversationAsSeen() {
		let { isLiveChannel } = this.props;

		if (isLiveChannel && this.uriData) {
			let { channel, channelType, server } = this.uriData;

			if (channelType === CHANNEL_TYPES.PRIVATE) {
				reportConversationAsSeenIfNeeded(server, channel);
			}
		}
	}

	setConversationAsOpen(uriData = this.uriData) {
		if (uriData) {
			let { channel, channelType, server } = uriData;

			if (channelType === CHANNEL_TYPES.PRIVATE) {
				setConversationAsOpen(server, channel);
			}
		}
	}

	setConversationAsClosed(uriData = this.uriData) {
		if (uriData) {
			let { channel, channelType, server } = uriData;

			if (channelType === CHANNEL_TYPES.PRIVATE) {
				setConversationAsClosed(server, channel);
			}
		}
	}

	// DOM

	flashLine(lineId) {
		let { root } = this.els;

		if (root) {
			const lineEl = root.querySelector(`#line-${lineId}`);
			if (lineEl) {
				// Center the line if possible
				// TODO: FIX
				/*window.scrollTo(0,
					lineEl.offsetTop - window.innerHeight/2
				);*/

				// Flashing
				lineEl.classList.remove(FLASHING_LINE_CLASS_NAME);

				setTimeout(() => {
					if (lineEl) {
						lineEl.classList.add(FLASHING_LINE_CLASS_NAME);
					}
				}, 1);

				setTimeout(() => {
					if (lineEl) {
						lineEl.classList.remove(FLASHING_LINE_CLASS_NAME);
					}
				}, 3000);
			}
		}
	}

	// Render

	render() {
		const {
			isLiveChannel,
			lines,
			loading,
			offlineMessages,
			pageQuery,
			pageType,
			userListOpen
		} = this.props;

		const displayChannel = pageType !== PAGE_TYPES.CHANNEL;
		const displayContextLink =
			pageType === PAGE_TYPES.CATEGORY &&
			pageQuery === "highlights";
		const displayUsername = pageType !== PAGE_TYPES.USER;
		const isConversation = this.uriData &&
			this.uriData.channelType === CHANNEL_TYPES.PRIVATE;

		var userList = null;

		if (isLiveChannel && !isConversation && userListOpen) {
			userList = <ChannelUserList
				channel={pageQuery}
				key="userList" />;
		}

		var allLines = lines;

		// Add any offline messages at the bottom

		if (offlineMessages) {
			const offlineLines = values(offlineMessages);

			if (offlineLines.length) {
				offlineLines.sort((a,b) => a.time > b.time);
				allLines = lines.concat(offlineLines);
			}
		}

		const content = <ChatLines
			displayChannel={displayChannel}
			displayContextLink={displayContextLink}
			displayUsername={displayUsername}
			loading={loading}
			messages={allLines}
			observer={this.observerHandlers}
			onEmoteLoad={this.scrollIfNeeded}
			key="main" />;

		return (
			<div
				className="mainview__content chatview__frame"
				ref={this.setRoot}>
				<div
					className="mainview__content__primary mainview__frame-container"
					key="primary">
					<div
						className="mainview__inner-frame scroller"
						ref={this.setPrimaryFrameEl}>
						{ content }
					</div>
				</div>
				{ userList ? (
					<div
						className="chatview__frame__secondary mainview__frame-container"
						key="secondary">
						<div
							className="mainview__inner-frame scroller scroller--thin">
							{ userList }
						</div>
					</div>
				) : null }
			</div>
		);
	}
}

ChatFrame.propTypes = {
	connectionStatus: PropTypes.object,
	currentLayout: PropTypes.array,
	inFocus: PropTypes.bool,
	isLiveChannel: PropTypes.bool,
	lineId: PropTypes.string,
	lines: PropTypes.array,
	loading: PropTypes.bool,
	logBrowserOpen: PropTypes.bool,
	logDate: PropTypes.string,
	offlineMessages: PropTypes.object,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired,
	selectedLine: PropTypes.object,
	userListOpen: PropTypes.bool
};

export default ChatFrame;
