import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";
import { Link } from "react-router";

import ChannelName from "./ChannelName.jsx";
import ChannelUserList from "./ChannelUserList.jsx";
import ChatInput from "./ChatInput.jsx";
import ChatLines from "./ChatLines.jsx";
import ChatUserListControl from "./ChatUserListControl.jsx";
import { channelUrlFromNames } from "../lib/channelNames";
import { requestLogDetailsForChannel, requestLogDetailsForUsername, requestLogFileForChannel, requestLogFileForUsername, subscribeToChannel, unsubscribeFromChannel, subscribeToUser, unsubscribeFromUser } from "../lib/io";
import { areWeScrolledToTheBottom, scrollToTheBottom, stickToTheBottom } from "../lib/visualBehavior";
import store from "../store";
import actions from "../actions";

class ChatView extends Component {
	constructor(props) {
		super(props);
		const { params } = this.props;

		this.closeLogBrowser = this.closeLogBrowser.bind(this);
		this.closeUserList = this.closeUserList.bind(this);
		this.logBrowserSubmit = this.logBrowserSubmit.bind(this);
		this.onClick = this.onClick.bind(this);
		this.openLogBrowser = this.openLogBrowser.bind(this);
		this.openUserList = this.openUserList.bind(this);
		this.toggleUserList = this.toggleUserList.bind(this);

		this.channelJustChanged = true;
		this.linesBeingChanged = false;
		this.lines = null;
		this.channelUrl = params.channelName && params.serverName
			? channelUrlFromNames(params.serverName, params.channelName) : null;
		this.wasAtBottomBeforeOpeningUserList = false;

		this.requestSubscription(params);
		this.requestLogFileIfNeeded();

		this.state = {
			logBrowserOpen: false,
			userListOpen: false
		};
	}

	componentDidMount() {
		this.requestLogDetails();
	}

	componentDidUpdate (prevProps, prevState) {

		// Force scroll to the bottom on first content after channel change

		if (this.linesBeingChanged) {
			this.linesBeingChanged = false;
			if (this.channelJustChanged) {
				this.channelJustChanged = false;
				console.log("Channel was just changed, and lines are being changed, scrolling!");
				scrollToTheBottom();
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

		stickToTheBottom();
	}

	shouldComponentUpdate (newProps, newState) {
		if (newProps) {
			const { params: currentParams } = this.props;
			const { params: newParams } = newProps;
			const newLines = this.getLines(newProps);

			// Channel change
			if (this.didChannelChange(currentParams, newParams)) {
				console.log("ChatView received new params:", newParams);

				this.channelUrl = newParams.channelName && newParams.serverName
					? channelUrlFromNames(newParams.serverName, newParams.channelName) : null;

				this.requestSubscription(newParams);
				this.requestUnsubscription(currentParams);
				this.requestLogDetails(newProps);

				this.lines = null;
				newState.logBrowserOpen = false;

				return true;
			}

			// Logs change
			if (currentParams.logDate != newParams.logDate) {
				this.requestLogFileIfNeeded(newProps);
			}

			// Lines change
			if (this.lines != newLines) {
				this.lines = newLines;

				if (newLines != null) {
					this.linesBeingChanged = true;
				}
				return true;
			}

			// Logs change (Part two. Shoot me.)

			if (currentParams.logDate != newParams.logDate) {
				return true;
			}

			const subjectName = this.subjectName();

			if (
				newProps.logDetails[subjectName] !=
				this.props.logDetails[subjectName]
			) {
				return true;
			}

			if (
				newProps.logFiles[subjectName] != this.props.logFiles[subjectName]
			) {
				return true;
			}
		}

		if (newState) {
			if (newState.logBrowserOpen != this.state.logBrowserOpen) {
				return true;
			}

			if (newState.userListOpen != this.state.userListOpen) {
				return true;
			}
		}

		return false;
	}

	closeLogBrowser() {
		this.setState({ logBrowserOpen: false });
	}

	closeUserList() {
		this.setState({ userListOpen: false });
	}

	didChannelChange (currentParams, newParams) {
		return currentParams.userName != newParams.userName ||
			currentParams.channelName != newParams.channelName ||
			currentParams.serverName != newParams.serverName;
	}

	getLines (props = this.props) {
		const { channelCaches, logFiles, params, userCaches } = props;

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

		return null;
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

	onClick() {
		// Hide the sidebar if it is not already hidden
		store.dispatch(actions.viewState.update({ sidebarVisible: false }));
	}

	openLogBrowser() {
		this.setState({ logBrowserOpen: true });
	}

	openUserList() {
		this.wasAtBottomBeforeOpeningUserList = areWeScrolledToTheBottom();
		this.setState({ userListOpen: true });
	}

	requestLogDetails(props = this.props) {
		const { params } = props;

		if (params.channelName && params.serverName) {
			requestLogDetailsForChannel(params.serverName + "/" + params.channelName);
		}
		else if (params.userName) {
			requestLogDetailsForUsername(params.userName);
		}
	}

	requestLogFile(props = this.props) {
		const { params } = props;

		if (params.logDate) {
			if (params.channelName && params.serverName) {
				requestLogFileForChannel(
					params.serverName + "/" + params.channelName,
					params.logDate
				);
			}
			else if (params.userName) {
				requestLogFileForUsername(params.userName, params.logDate);
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
		const { channelName, serverName, userName } = params;
		if (channelName && serverName) {
			subscribeToChannel(channelUrlFromNames(serverName, channelName));
		}
		else if (userName) {
			subscribeToUser(userName);
		}
	}

	requestUnsubscription(params) {
		const { channelName, serverName, userName } = params;
		if (channelName && serverName) {
			unsubscribeFromChannel(channelUrlFromNames(serverName, channelName));
		}
		else if (userName) {
			unsubscribeFromUser(userName);
		}
	}

	subjectName(divider = ":") {
		// TODO: Use subject names more widely and perhaps merge caches and lastseens

		const { params } = this.props;
		if (params.channelName && params.serverName) {
			return `channel${divider}${params.serverName}/${params.channelName}`;
		}
		else if (params.userName) {
			return `user${divider}${params.userName}`;
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
		const { userListOpen } = this.state;

		const heading = this.channelUrl
			? <ChannelName channel={this.channelUrl} key={this.channelUrl} />
			: params.userName;

		const contentParams = {
			displayChannel:  !this.channelUrl,
			displayUsername: !!this.channelUrl,
			messages
		};

		const content = <ChatLines {...contentParams} key="main" />;

		const controls = this.renderControls();
		const logBrowser = this.renderLogBrowser();

		const isLiveChannel = this.channelUrl && !params.logDate;

		const className = "chatview" +
			(isLiveChannel ? " chatview--live-channel" : "") +
			(logBrowser ? " chatview--logbrowsing" : "") +
			(userListOpen ? " chatview--userlisting" : "");

		var input = null, userList = null;

		if (isLiveChannel) {
			input = <ChatInput channel={this.channelUrl} key="input" />;
			userList = userListOpen
				? <ChannelUserList channel={this.channelUrl} key="userList" />
				: null;
		}

		return (
			<div id="chatview" className={className} onClick={this.onClick}>
				<div className="chatview__top">
					<h2>{ heading }</h2>
					{ controls }
					{ logBrowser }
				</div>
				{ content }
				{ input }
				{ userList }
			</div>
		);
	}
}

ChatView.propTypes = {
	channelCaches: PropTypes.object,
	logDetails: PropTypes.object,
	logFiles: PropTypes.object,
	params: PropTypes.object,
	router: PropTypes.object,
	userCaches: PropTypes.object
};

export default connect(
	({
		channelCaches,
		logDetails,
		logFiles,
		userCaches
	}) => ({
		channelCaches,
		logDetails,
		logFiles,
		userCaches
	})
)(ChatView);
