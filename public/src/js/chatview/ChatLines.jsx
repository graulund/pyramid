import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatLine from "./ChatLine.jsx";
import { humanDateStamp } from "../lib/formatting";

const block = "chatlines";

class ChatLines extends PureComponent {
	render() {
		const {
			collapseJoinParts,
			displayChannel,
			displayContextLink,
			displayFirstDate = true,
			displayUsername,
			messages,
			observer,
			onEmoteLoad
		} = this.props;

		if (!messages || !messages.length) {
			return null;
		}

		var lastDateString = "";

		const lines = messages.map((msg, index) => {
			if (msg) {
				var dateString = humanDateStamp(new Date(msg.time), true, true);
				var line = <ChatLine {...msg}
					collapseJoinParts={collapseJoinParts}
					displayChannel={displayChannel}
					displayContextLink={displayContextLink}
					displayUsername={displayUsername}
					observer={observer}
					onEmoteLoad={onEmoteLoad}
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

		const className = block +
			(displayContextLink ? ` ${block}--with-context` : "");

		return <ul className={className}>{ lines }</ul>;
	}
}

ChatLines.propTypes = {
	collapseJoinParts: PropTypes.bool,
	displayChannel: PropTypes.bool,
	displayContextLink: PropTypes.bool,
	displayFirstDate: PropTypes.bool,
	displayUsername: PropTypes.bool,
	messages: PropTypes.array,
	observer: PropTypes.object,
	onEmoteLoad: PropTypes.func
};

export default ChatLines;
