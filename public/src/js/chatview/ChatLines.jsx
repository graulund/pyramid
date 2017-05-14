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
			loading,
			messages,
			observer,
			onEmoteLoad
		} = this.props;

		var content = null;

		if (messages && messages.length) {
			var lastDateString = "";

			content = messages.map((msg, index) => {
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
		}
		else if (!loading) {
			content = <li className={`${block}__empty`} key="empty">Nothing here :(</li>;
		}

		const className = block +
			(displayContextLink ? ` ${block}--with-context` : "");

		return <ul className={className}>{ content }</ul>;
	}
}

ChatLines.propTypes = {
	collapseJoinParts: PropTypes.bool,
	displayChannel: PropTypes.bool,
	displayContextLink: PropTypes.bool,
	displayFirstDate: PropTypes.bool,
	displayUsername: PropTypes.bool,
	loading: PropTypes.bool,
	messages: PropTypes.array,
	observer: PropTypes.object,
	onEmoteLoad: PropTypes.func
};

export default ChatLines;
