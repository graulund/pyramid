import React, { PureComponent, PropTypes } from "react";

import ChatLine from "./ChatLine.jsx";
import { humanDateStamp } from "../lib/formatting";

class ChatLines extends PureComponent {
	render() {
		const {
			displayChannel,
			displayContextLink,
			displayFirstDate = true,
			displayUsername,
			messages,
			observer
		} = this.props;

		if (!messages || !messages.length) {
			return null;
		}

		var lastDateString = "";

		const lines = messages.map((msg, index) => {
			if (msg) {
				var dateString = humanDateStamp(new Date(msg.time), true, true);
				var line = <ChatLine {...msg}
					displayChannel={displayChannel}
					displayContextLink={displayContextLink}
					displayUsername={displayUsername}
					observer={observer}
					key={msg.lineId || index} />;

				if (dateString !== lastDateString) {
					if (displayFirstDate || lastDateString !== "") {
						lastDateString = dateString;
						return [
							(<li className="date-header" key={dateString}>
								<span>{ dateString }</span>
							</li>),
							line
						];
					}
					else {
						lastDateString = dateString;
					}
				}

				return line;
			}

			return null;
		});

		return <ul className="chatlines">{ lines }</ul>;
	}
}

ChatLines.propTypes = {
	displayChannel: PropTypes.bool,
	displayContextLink: PropTypes.bool,
	displayFirstDate: PropTypes.bool,
	displayUsername: PropTypes.bool,
	messages: PropTypes.array,
	observer: PropTypes.object
};

export default ChatLines;
