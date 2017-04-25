import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router";
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

		if (logRequestInput && logRequestInput.value && router) {
			router.push(logUrl(logRequestInput.value));
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

export default ChatViewLogBrowser;
