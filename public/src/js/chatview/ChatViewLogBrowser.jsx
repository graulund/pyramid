import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import forOwn from "lodash/forOwn";

class ChatViewLogBrowser extends PureComponent {
	constructor(props) {
		super(props);
		this.logBrowserSubmit = this.logBrowserSubmit.bind(this);
	}

	logBrowserSubmit(evt) {
		const { logUrl } = this.props;
		const { router } = this.context;
		const { logRequestInput } = this.refs;

		if (evt) {
			evt.preventDefault();
		}

		if (logRequestInput && logRequestInput.value && router && router.history) {
			router.history.push(logUrl(logRequestInput.value));
		}
	}

	render() {
		const { logDate, logDetails, logUrl } = this.props;

		var timeStamps = [];

		forOwn(logDetails, (hasLog, timeStamp) => {
			if (hasLog) {
				timeStamps.push(timeStamp);
			}
		});

		timeStamps.sort();

		const detailsEls = timeStamps.map((timeStamp) => {
			const url = logUrl(timeStamp);
			const className = timeStamp === logDate
				? "current" : "";
			const lines = logDetails[timeStamp];
			const title = `${lines} line` + (lines === 1 ? "" : "s");

			return (
				<li key={timeStamp}>
					<Link to={url} className={className} title={title}>
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
						<input type="date" ref="logRequestInput" />
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
	logUrl: PropTypes.func
};

ChatViewLogBrowser.contextTypes = {
	router: PropTypes.object
};

export default ChatViewLogBrowser;
