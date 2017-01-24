import React, { PureComponent, PropTypes } from "react";
import moment from "moment";

import ChatLine from "./ChatLine.jsx";

const DATE_STRING_FORMAT = "dddd, MMMM Do YYYY";

class ChatLines extends PureComponent {
	render() {
		const { displayChannel, displayUsername, messages, observer } = this.props;

		if (!messages || !messages.length) {
			return null;
		}

		var lastDateString = "";

		const lines = messages.map((msg, index) => {
			if (msg) {
				var dateString = moment(msg.time).format(DATE_STRING_FORMAT);
				var line = <ChatLine {...msg}
					displayChannel={displayChannel}
					displayUsername={displayUsername}
					observer={observer}
					key={msg.id || index} />;

				if (dateString !== lastDateString) {
					lastDateString = dateString;
					return [
						(<li className="date-header" key={dateString}>
							<span>{ dateString }</span>
						</li>),
						line
					];
				}

				return line;
			}

			return null;
		});

		return <ul>{ lines }</ul>;
	}
}

ChatLines.propTypes = {
	displayChannel: PropTypes.bool,
	displayUsername: PropTypes.bool,
	messages: PropTypes.array,
	observer: PropTypes.object
};

export default ChatLines;
