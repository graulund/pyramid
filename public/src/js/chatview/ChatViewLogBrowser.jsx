import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import forOwn from "lodash/forOwn";

import ChatViewLink from "../components/ChatViewLink.jsx";
import { PAGE_TYPE_NAMES } from "../constants";
import { pluralize } from "../lib/formatting";
import { refElSetter } from "../lib/refEls";

class ChatViewLogBrowser extends PureComponent {
	constructor(props) {
		super(props);

		this.logBrowserSubmit = this.logBrowserSubmit.bind(this);

		this.els = {};
		this.setLogRequestInput = refElSetter("logRequestInput").bind(this);
	}

	logBrowserSubmit(evt) {
		const { logUrl } = this.props;
		const { router } = this.context;
		const { logRequestInput } = this.els;

		if (evt) {
			evt.preventDefault();
		}

		if (logRequestInput && logRequestInput.value && router && router.history) {
			router.history.push(logUrl(logRequestInput.value));
		}
	}

	render() {
		const { logDate, logDetails, pageQuery, pageType } = this.props;

		var timeStamps = [];

		forOwn(logDetails, (hasLog, timeStamp) => {
			if (hasLog) {
				timeStamps.push(timeStamp);
			}
		});

		timeStamps.sort();

		const detailsEls = timeStamps.map((timeStamp) => {
			let className = timeStamp === logDate ? "current" : "";
			let lines = logDetails[timeStamp];
			let title = lines + " " + pluralize(lines, "line", "s");

			return (
				<li key={timeStamp}>
					<ChatViewLink
						type={pageType}
						query={pageQuery}
						date={timeStamp}
						className={className}
						title={title}>
						{ timeStamp }
					</ChatViewLink>
				</li>
			);
		});

		return (
			<div className="logbrowser chatview__logbrowser">
				<form onSubmit={this.logBrowserSubmit}
					className="logbrowser__request">
					<div>
						{"Pick a date: "}
						<input type="date" ref={this.setLogRequestInput} />
						{" "}
						<input type="submit" value="Go" />
					</div>
				</form>
				<ul className="logbrowser__items">
					{ detailsEls }
				</ul>
			</div>
		);
	}
}

ChatViewLogBrowser.propTypes = {
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	logUrl: PropTypes.func,
	pageQuery: PropTypes.string.isRequired,
	pageType: PropTypes.oneOf(PAGE_TYPE_NAMES).isRequired
};

ChatViewLogBrowser.contextTypes = {
	router: PropTypes.object
};

export default ChatViewLogBrowser;
