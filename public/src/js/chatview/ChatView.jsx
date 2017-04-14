import React, { Component } from "react";
import PropTypes from "prop-types";
import { findDOMNode } from "react-dom";
import { connect } from "react-redux";
import { Link } from "react-router";
import remove from "lodash/remove";
import "intersection-observer";

import ChannelName from "../components/ChannelName.jsx";
import ChannelUserList from "./ChannelUserList.jsx";
import ChatInput from "./ChatInput.jsx";
import ChatLines from "./ChatLines.jsx";
import ChatUserListControl from "./ChatUserListControl.jsx";
import Loader from "../components/Loader.jsx";
import { channelUrlFromNames } from "../lib/channelNames";
import { timeStampDate } from "../lib/formatting";
import * as io from "../lib/io";
import { parseLineIdHash } from "../lib/routeHelpers";
import { areWeScrolledToTheBottom, scrollToTheBottom, stickToTheBottom } from "../lib/visualBehavior";
import { CATEGORY_NAMES } from "../constants";
import store from "../store";
import actions from "../actions";

const FLASHING_LINE_CLASS_NAME = "flashing";

class ChatView extends Component {
	constructor(props) {
		super(props);
		const { params } = this.props;

		// Methods to be called outside of scope

		this.closeLogBrowser = this.closeLogBrowser.bind(this);
		this.closeUserList = this.closeUserList.bind(this);
		this.lineObserverCallback = this.lineObserverCallback.bind(this);
		this.logBrowserSubmit = this.logBrowserSubmit.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onObserve = this.onObserve.bind(this);
		this.onUnobserve = this.onUnobserve.bind(this);
		this.openLogBrowser = this.openLogBrowser.bind(this);
		this.openUserList = this.openUserList.bind(this);
		this.toggleUserList = this.toggleUserList.bind(this);

		// Internal state

		this.channelJustChanged = true;
		this.linesBeingChanged = false;
		this.lines = null;
		this.channelUrl = params.channelName && params.serverName
			? channelUrlFromNames(params.serverName, params.channelName) : null;
		this.wasAtBottomBeforeOpeningUserList = false;

		// Request data

		this.requestSubscription(params);
		this.requestLogFileIfNeeded();

		this.observerHandlers = { observe: this.onObserve, unobserve: this.onUnobserve };
		this.clearObserver();

		// View-related state

		this.state = {
			loading: true,
			logBrowserOpen: false,
			userListOpen: false,
			waitingForInfoForLineId: null
		};
	}

	componentDidMount() {
		this.requestLogDetails();
	}

	shouldComponentUpdate (newProps, newState) {
		if (newProps) {
			const { params: currentParams, lineInfo: currentLineInfo } = this.props;
			const { params: newParams, lineInfo: newLineInfo } = newProps;
			const newLines = this.getLines(newProps);

			// TODO: Clean up this method

			// Redirect
			const requestedLineId = newState.waitingForInfoForLineId;
			if (newLineInfo[requestedLineId] && !currentLineInfo[requestedLineId]) {
				const info = newLineInfo[requestedLineId];
				this.redirectToLineInLog(info);
				return true;
			}

			// Channel change
			if (this.didChannelChange(currentParams, newParams)) {
				console.log("ChatView received new params:", newParams);

				this.channelUrl = newParams.channelName && newParams.serverName
					? channelUrlFromNames(newParams.serverName, newParams.channelName) : null;

				this.startLoading();
				this.requestSubscription(newParams);
				this.requestUnsubscription(currentParams);
				this.requestLogDetails(newProps);
				this.clearObserver(newProps, newState);

				this.lines = null;
				newState.logBrowserOpen = false;

				return true;
			}

			// Logs change
			if (currentParams.logDate !== newParams.logDate) {
				this.startLoading();
				this.requestLogFileIfNeeded(newProps);
				this.clearObserver(newProps, newState);
			}

			// Lines change
			if (this.lines !== newLines) {
				this.lines = newLines;

				if (newLines !== null) {
					this.linesBeingChanged = true;
				}
				return true;
			}

			// Logs change (Part two. Shoot me.)

			if (currentParams.logDate !== newParams.logDate) {
				return true;
			}

			const subjectName = this.subjectName();

			if (
				newProps.logDetails[subjectName] !==
				this.props.logDetails[subjectName]
			) {
				return true;
			}

			if (
				newProps.logFiles[subjectName] !== this.props.logFiles[subjectName]
			) {
				return true;
			}
		}

		if (newState) {
			if (newState.logBrowserOpen !== this.state.logBrowserOpen) {
				this.resetObserver(newProps, newState);
				return true;
			}

			if (newState.userListOpen !== this.state.userListOpen) {
				return true;
			}

			if (newState.loading !== this.state.loading) {
				return true;
			}
		}

		return false;
	}

	componentWillReceiveProps(newProps) {
		const { params: currentParams } = this.props;
		const { params: newParams } = newProps;
		if (currentParams.logDate !== newParams.logDate) {
			this.requestLogFileIfNeeded(newProps);
		}
	}

	componentDidUpdate (prevProps, prevState) {

		// Force scroll to the bottom on first content after channel change

		if (this.linesBeingChanged) {
			this.linesBeingChanged = false;
			if (this.channelJustChanged) {
				this.channelJustChanged = false;
				this.onFirstContent();
				return;
			}
		}

		if (this.channelJustChanged) {
			this.channelJustChanged = false;
		}

		if (prevProps) {
			const { params: prevParams } = prevProps;
			const { params: currentParams } = this.props;

			if (this.didChannelChange(prevParams, currentParams)) {
				this.channelJustChanged = true;
			}
		}

		// If we just opened stuff that made us not be at the bottom anymore,
		// do a check and keep the scroll no matter what

		if (this.wasAtBottomBeforeOpeningUserList) {
			this.wasAtBottomBeforeOpeningUserList = false;
			if (prevState && !prevState.userListOpen && this.state.userListOpen) {
				scrollToTheBottom();
			}
		}

		// Otherwise just stick if we're already there

		// TODO: Split it up and evaluate whether we're already at the bottom *before* any changes occurred, not after (provided we're on the same page still)
		// Otherwise, this breaks when a really long message is entered

		stickToTheBottom();
	}

	clearObserver(props = this.props, state = this.state) {
		if (this.observer) {
			this.observer.disconnect();
		}

		this.setObserver(props, state);

		// Do NOT carry old ones over
		this.observed = [];
	}

	closeLogBrowser() {
		this.setState({ logBrowserOpen: false });
	}

	closeUserList() {
		this.setState({ userListOpen: false });
	}

	didChannelChange (currentParams, newParams) {
		return currentParams.userName !== newParams.userName ||
			currentParams.channelName !== newParams.channelName ||
			currentParams.serverName !== newParams.serverName ||
			currentParams.categoryName !== newParams.categoryName ||
			currentParams.logDate !== newParams.logDate;
	}

	endLoading() {
		this.setState({ loading: false });
		this.loading = false;
	}

	flashLine(lineId) {
		const root = findDOMNode(this);
		if (root) {
			const lineEl = root.querySelector(`#line-${lineId}`);
			if (lineEl) {
				// Center the line if possible
				window.scrollTo(0, lineEl.offsetTop - window.innerHeight/2);

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

	getLines (props = this.props) {
		const { categoryCaches, channelCaches, logFiles, params, userCaches } = props;

		if (params.logDate) {
			const subjectName = this.subjectName();
			if (logFiles[subjectName]) {
				return logFiles[subjectName][params.logDate];
			} else {
				return null;
			}
		}

		if (params.channelName && params.serverName) {
			return channelCaches[channelUrlFromNames(params.serverName, params.channelName)];
		}
		else if (params.userName) {
			return userCaches[params.userName];
		}
		else if (params.categoryName) {
			return categoryCaches[params.categoryName];
		}

		return null;
	}

	getObserver (props = this.props, state = this.state) {
		const { params } = props;
		const logBrowserOpen = state ? state.logBrowserOpen : false;
		const isLiveChannel = this.channelUrl && !params.logDate;

		// Acknowledge that there's an overlay when we're viewing a live channel, coming from the input

		var topMargin = -40, bottomMargin = 0;

		if (isLiveChannel) {
			bottomMargin = -80;
		}

		if (logBrowserOpen || params.logDate) {
			topMargin = -70;
		}

		const rootMargin = topMargin + "px 0px " + bottomMargin + "px 0px";

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

	logBrowserSubmit(evt) {
		const { router } = this.props;
		const { logRequestInput } = this.refs;

		if (evt) {
			evt.preventDefault();
		}

		if (logRequestInput && logRequestInput.value && router) {
			router.push(this.logUrl(logRequestInput.value));
		}
	}

	logUrl(timeStamp) {
		return this.url() + "/log/" + timeStamp;
	}

	lineObserverCallback(entries) {
		entries.forEach((entry) => {
			if (
				entry &&
				entry.target &&
				entry.target.lineId &&
				entry.intersectionRatio >= 1 &&
				this.observed.indexOf(entry.target) >= 0
			) {
				io.reportHighlightAsSeen(entry.target.lineId);
				this.onUnobserve(entry.target);

				if (entry.target.onUnobserve) {
					entry.target.onUnobserve();
				}
			}
		});
	}

	onClick() {
		// Hide the sidebar if it is not already hidden
		store.dispatch(actions.viewState.update({ sidebarVisible: false }));
	}

	onFirstContent() {
		const { params } = this.props;

		this.endLoading();

		// Scroll to the bottom if we are a live channel
		if (!params.logDate) {
			console.log(
				"Channel was just changed, and lines are being changed, scrolling!"
			);
			scrollToTheBottom();
		}

		// Are we querying a specific line id
		if (location.hash) {
			const lineId = parseLineIdHash(location.hash);
			if (lineId) {
				// Check if the id in the hash exists in the current log...

				const line = this.lines.filter((line) => line.lineId === lineId)[0];

				// If it does, scroll to it.

				if (line) {
					this.flashLine(lineId);
				}

				// If it does not, send the request for line info.

				// Then respond to line info update, and then navigate to the log with the given date.

				else {
					const { lineInfo } = this.props;
					if (lineInfo[lineId]) {
						this.redirectToLineInLog(lineInfo[lineId]);
					}
					else {
						this.setState({ waitingForInfoForLineId: lineId });
						io.requestLineInfo(lineId);
					}
				}
			}
		}
	}

	openLogBrowser() {
		this.setState({ logBrowserOpen: true });
	}

	openUserList() {
		this.wasAtBottomBeforeOpeningUserList = areWeScrolledToTheBottom();
		this.setState({ userListOpen: true });
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

	redirectToLineInLog(line) {
		const { router } = this.props;
		const newPath = this.logUrl(timeStampDate(line.time));

		if (location.pathname === newPath) {
			console.warn("Tried to redirect to line in log URL, but it was already the current URL.");
			return;
		}

		router.replace(newPath + `#line-${line.lineId}`);
		this.setState({ waitingForInfoForLineId: null });
	}

	requestLogDetails(props = this.props) {
		const { params } = props;

		if (params.channelName && params.serverName) {
			io.requestLogDetailsForChannel(params.serverName + "/" + params.channelName);
		}
		else if (params.userName) {
			io.requestLogDetailsForUsername(params.userName);
		}
	}

	requestLogFile(props = this.props) {
		const { params } = props;

		if (params.logDate) {
			if (params.channelName && params.serverName) {
				io.requestLogFileForChannel(
					params.serverName + "/" + params.channelName,
					params.logDate
				);
			}
			else if (params.userName) {
				io.requestLogFileForUsername(params.userName, params.logDate);
			}
		}
	}

	requestLogFileIfNeeded(props = this.props) {
		const { logFiles, params } = props;

		if (params.logDate) {
			const subjectName = this.subjectName();
			if (!logFiles[subjectName] || !logFiles[subjectName][params.logDate]) {
				this.requestLogFile(props);
			}
		}
	}

	requestSubscription(params) {
		const { categoryName, channelName, serverName, userName } = params;
		if (channelName && serverName) {
			io.subscribeToChannel(channelUrlFromNames(serverName, channelName));
		}
		else if (userName) {
			io.subscribeToUser(userName);
		}
		else if (categoryName) {
			io.subscribeToCategory(categoryName);
		}
	}

	requestUnsubscription(params) {
		const { categoryName, channelName, serverName, userName } = params;
		if (channelName && serverName) {
			io.unsubscribeFromChannel(channelUrlFromNames(serverName, channelName));
		}
		else if (userName) {
			io.unsubscribeFromUser(userName);
		}
		else if (categoryName) {
			io.unsubscribeFromCategory(categoryName);
		}
	}

	resetObserver (props = this.props, state = this.state) {
		if (this.observer) {
			this.observer.disconnect();
		}
		this.setObserver(props, state);

		// Carry old ones over
		this.observed.forEach((el) => {
			this.observer.observe(el);
		});
	}

	startLoading() {
		this.setState({ loading: true });
		this.loading = true;
	}

	setObserver (props = this.props, state = this.state) {
		this.observer = this.getObserver(props, state);
	}

	subjectName(divider = ":") {
		const { params } = this.props;
		if (params.channelName && params.serverName) {
			return `channel${divider}${params.serverName}/${params.channelName}`;
		}
		else if (params.userName) {
			return `user${divider}${params.userName}`;
		}
		else if (params.categoryName) {
			return `category${divider}${params.categoryName}`;
		}

		return "";
	}

	toggleUserList() {
		const { userListOpen } = this.state;
		if (userListOpen) {
			this.closeUserList();
		} else {
			this.openUserList();
		}
	}

	url() {
		return "/" + this.subjectName("/");
	}

	// Rendering

	renderControls() {
		const { params } = this.props;
		const { logBrowserOpen } = this.state;

		if (!this.channelUrl && !params.userName) {
			// Not loggable
			return null;
		}

		const isLiveChannel = this.channelUrl && !params.logDate;

		var logBrowserToggler = null;

		if (params.logDate) {
			logBrowserToggler = <Link to={this.url()}>Live</Link>;
		} else {
			if (logBrowserOpen) {
				logBrowserToggler = (
					<a href="javascript://"
						onClick={this.closeLogBrowser}
						key="logControl">
						Close
					</a>
				);
			} else {
				logBrowserToggler = (
					<a href="javascript://"
						onClick={this.openLogBrowser}
						key="logControl">
						Logs
					</a>
				);
			}
		}

		const chatUserListToggler = <ChatUserListControl
			channel={this.channelUrl}
			onClick={this.toggleUserList}
			key="userListControl" />;

		return (
			<ul className="controls chatview__controls">
				{ isLiveChannel ? (<li>{ chatUserListToggler }</li>) : null }
				<li>{ logBrowserToggler }</li>
			</ul>
		);
	}

	renderLogBrowser() {
		const { logBrowserOpen } = this.state;
		const { logDetails, logFiles, params } = this.props;

		if (logBrowserOpen || params.logDate) {

			const subjectName = this.subjectName();

			var timeStamps = {}, timeStamp;

			const details = logDetails[subjectName];

			if (details) {
				for (timeStamp in details) {
					if (details.hasOwnProperty(timeStamp) && details[timeStamp]) {
						timeStamps[timeStamp] = true;
					}
				}
			}

			const files = logFiles[subjectName];

			if (files) {
				for (timeStamp in files) {
					if (files.hasOwnProperty(timeStamp) && files[timeStamp]) {
						timeStamps[timeStamp] = true;
					}
				}
			}

			timeStamps = Object.keys(timeStamps).sort();

			const detailsEls = timeStamps.map((timeStamp) => {
				const url = this.logUrl(timeStamp);
				const className = timeStamp === params.logDate ? "current" : "";
				return (
					<li key={timeStamp}>
						<Link to={url} className={className}>
							{ timeStamp }
						</Link>
					</li>
				);
			});

			return (
				<div className="logbrowser chatview__logbrowser">
					<form onSubmit={this.logBrowserSubmit}
						className="logbrowser__request">
						<div>
							{"Pick a date: "}
							<input type="date" ref="logRequestInput" />{" "}
							<input type="submit" value="Go" />
						</div>
					</form>
					<ul className="logbrowser__items">
						{ detailsEls }
					</ul>
				</div>
			);
		}

		return null;
	}

	render() {
		const messages = this.lines;
		const { params } = this.props;
		const { loading, userListOpen } = this.state;

		var heading = null;

		if (this.channelUrl) {
			heading = <ChannelName channel={this.channelUrl} key={this.channelUrl} />;
		}
		else if (params.userName) {
			heading = params.userName;
		}
		else if (params.categoryName) {
			heading = CATEGORY_NAMES[params.categoryName] || "";
		}

		const contentParams = {
			displayChannel: !this.channelUrl || !!params.categoryName,
			displayContextLink: params.categoryName === "highlights",
			displayUsername: !!this.channelUrl || !!params.categoryName,
			messages,
			observer: this.observerHandlers
		};

		const content = <ChatLines {...contentParams} key="main" />;

		const controls = this.renderControls();
		const logBrowser = this.renderLogBrowser();

		const isLiveChannel = this.channelUrl && !params.logDate;

		const className = "mainview chatview" +
			(isLiveChannel ? " chatview--live-channel" : "") +
			(logBrowser ? " chatview--logbrowsing" : "") +
			(userListOpen && isLiveChannel ? " chatview--userlisting" : "");

		var input = null, userList = null;

		if (isLiveChannel) {
			input = <ChatInput channel={this.channelUrl} key="input" />;
			userList = userListOpen && isLiveChannel
				? <ChannelUserList channel={this.channelUrl} key="userList" />
				: null;
		}

		var loader = null;

		if (loading || this.loading) {
			loader = <Loader key="loader" />;
		}

		return (
			<div className={className} onClick={this.onClick}>
				<div className="mainview__top" key="top">
					<div className="mainview__top__main" key="topMain">
						<h2>{ heading }</h2>
						{ controls }
					</div>
					{ logBrowser }
				</div>
				{ content }
				{ input }
				{ userList }
				{ loader }
			</div>
		);
	}
}

ChatView.propTypes = {
	categoryCaches: PropTypes.object,
	channelCaches: PropTypes.object,
	lineInfo: PropTypes.object,
	logDetails: PropTypes.object,
	logFiles: PropTypes.object,
	params: PropTypes.object,
	router: PropTypes.object,
	userCaches: PropTypes.object
};

export default connect(
	({
		categoryCaches,
		channelCaches,
		lineInfo,
		logDetails,
		logFiles,
		userCaches
	}) => ({
		categoryCaches,
		channelCaches,
		lineInfo,
		logDetails,
		logFiles,
		userCaches
	})
)(ChatView);
