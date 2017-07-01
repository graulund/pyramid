import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatLine from "./ChatLine.jsx";
import { humanDateStamp } from "../lib/formatting";

const block = "chatlines";

class ChatLines extends PureComponent {

	renderDateHeader(dateString) {
		if (!this.dateHeaderCache) {
			this.dateHeaderCache = {};
		}

		let cachedEl = this.dateHeaderCache[dateString];

		if (cachedEl) {
			return cachedEl;
		}

		let out = (
			<li className="date-header" key={dateString}>
				<span>{ dateString }</span>
			</li>
		);

		this.dateHeaderCache[dateString] = out;

		return out;
	}

	render() {
		const {
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

			content = [];

			messages.forEach((msg, index) => {
				if (msg) {
					var dateString = humanDateStamp(new Date(msg.time), true, true);
					var line = <ChatLine {...msg}
						displayChannel={displayChannel}
						displayContextLink={displayContextLink}
						displayUsername={displayUsername}
						observer={observer}
						onEmoteLoad={onEmoteLoad}
						key={msg.lineId || index} />;

					// Detect date change
					if (dateString !== lastDateString) {

						// Insert date header
						if (displayFirstDate || lastDateString !== "") {
							lastDateString = dateString;
							content.push(
								this.renderDateHeader(dateString)
							);
						}

						else {
							lastDateString = dateString;
						}
					}

					content.push(line);
				}
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
