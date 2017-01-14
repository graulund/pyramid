import React, { Component, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import moment from "moment";
import debounce from "lodash/debounce";

import { formatTime, timeColors } from "../lib/formatting";

class TimedItem extends Component {

	constructor(props) {
		super(props);

		this.flash = debounce(this.flash.bind(this), 150);

		this.state = {
			flashing: false
		};
	}

	componentDidMount() {
		const root = findDOMNode(this);
		if (root) {
			// Piggybacking onto livestamp changes through jQuery
			window.jQuery("time", root).on("change.livestamp", () => {
				if (this.refs && this.refs.time && this.refs.sts) {
					const dt = this.refs.time.getAttribute("datetime");
					this.refs.sts.textContent = this.renderSecondaryTimestamp(dt);
					const styles = timeColors(dt);
					for(var property in styles) {
						root.style[property] = styles[property];
					}
				}
			});
		}
	}

	componentWillReceiveProps(newProps) {
		if (newProps) {
			const { time: oldTime } = this.props;
			const { time: newTime } = newProps;

			if (oldTime != newTime) {
				// Do a lil' flash!
				this.flash();
			}
		}
	}

	flash() {
		this.setState({ flashing: true });
		setTimeout(() => {
			this.setState({ flashing: false });
		}, 200);
	}

	renderSecondaryTimestamp(time) {
		const m = moment(time);
		const ms = moment().diff(m);
		const timeInfo = formatTime(ms);
		var sts = m.format("H:mm");
		const ym = moment().subtract(1, "days").startOf("day");

		if(timeInfo.day == 1 && ym < m){
			sts = "yesterday " + sts;
		}

		// If the date is before yesterday midnight, it's earlier than yesterday.
		if(ym > m){
			sts = "";
		}

		return sts;
	}

	render() {
		const { className: givenClassName, prefix, skipOld = true, suffix, time } = this.props;
		const { flashing } = this.state;

		var primaryTimeEl = null, secondaryTimeEl = null, styles;

		// If time is known at all
		if (time) {
			const m = moment(time);

			// Skip people who haven't been here for a certain amount of days :(

			if (skipOld) {
				const ms = moment().diff(m);
				const timeInfo = formatTime(ms);

				if (timeInfo.day >= 3) {
					return null;
				}
			}

			// Display values
			const secondaryTimestamp = this.renderSecondaryTimestamp(m);
			styles = timeColors(m);

			// Livestamp content; if we pretend like the livestamp script has already taken effect,
			// it looks more smooth when updating
			const livestampContent = this.hasRenderedOnce
				? "a few seconds ago"
				: m.format("H:mm:ss");

			primaryTimeEl = (
				<time ref="time" dateTime={time} data-livestamp={m.format("X")}>
				{ livestampContent }
				</time>
			);
			secondaryTimeEl = <div className="ts" ref="sts">{ secondaryTimestamp }</div>;
		} else {
			styles = timeColors("1970-01-01 00:00:00");
		}

		// Class names

		var classNames = [];

		if (givenClassName) {
			classNames.push(givenClassName);
		}

		if (flashing) {
			classNames.push("flash");
		}

		var className = classNames.join(" ");

		this.hasRenderedOnce = true;

		return (
			<li className={className} style={styles}>
				<div className="l">
					{ prefix }
					{ prefix && primaryTimeEl ? " " : null }
					{ primaryTimeEl }
					{ suffix ? " " : null }
					{ suffix }
				</div>
				{ secondaryTimeEl }
			</li>
		);
	}
}

TimedItem.propTypes = {
	className: PropTypes.string,
	prefix: PropTypes.node,
	skipOld: PropTypes.bool,
	suffix: PropTypes.node,
	time: PropTypes.string
};

export default TimedItem;
