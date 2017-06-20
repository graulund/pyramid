import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { findDOMNode } from "react-dom";
import TimeAgo from "react-timeago";

import { formatTime, midnightDate, prevDay, timeColors, timeStamp }
	from "../lib/formatting";
import { refElSetter } from "../lib/refEls";

// Custom timeago formatter for more succinct outputs

const formatter = (value, unit, suffix, date, defaultFormatter) => {

	// Reduce granularity for really recent events
	if (unit === "second") {
		if (value < 30) {
			return "now";
		}
		else {
			return "1m " + suffix;
		}
	}

	if (
		unit === "second" ||
		unit === "minute" ||
		unit === "hour" ||
		unit === "day"
	) {
		return value + unit[0] + " " + suffix;
	}

	return defaultFormatter(value, unit, suffix, date);
};

class TimedItem extends PureComponent {

	constructor(props) {
		super(props);

		this.endFlash = this.endFlash.bind(this);
		this.flash = this.flash.bind(this);
		this.renderClassName = this.renderClassName.bind(this);
		this.tick = this.tick.bind(this);

		this.isStillMounted = false;
		this.date = new Date(props.time);

		this.els = {};
		this.setSts = refElSetter("sts").bind(this);

		this.state = {
			shieldedNow: false
		};
	}

	componentDidMount() {
		const root = findDOMNode(this);
		if (root) {
			// Store the root
			this.root = root;

			// Start ticking
			this.isStillMounted = true;
			this.tick();
		}
	}

	componentWillReceiveProps(newProps) {
		if (newProps) {
			const { time: oldTime } = this.props;
			const { time: newTime } = newProps;

			if (oldTime !== newTime) {
				this.date = new Date(newTime);

				// Do a lil' flash!
				this.flash();

				// Shield the "now" time element for performance reasons
				this.setState({ shieldedNow: true });
			}
		}
	}

	componentDidUpdate() {
		this.handleWideSts();
	}

	componentWillUnmount() {
		this.isStillMounted = false;

		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}
	}

	tick() {
		if (!this.isStillMounted) {
			return;
		}

		let { shieldedNow } = this.state;

		if (this.root && this.els.sts) {
			const then = this.date;
			const diff = Math.abs(Date.now() - then);

			if (diff >= 30000 && shieldedNow) {
				// Unshield the "now" if we get too far away from the time
				this.setState({ shieldedNow: false });
			}

			// Secondary time stamp
			const secondaryTimestamp = this.renderSecondaryTimestamp(then);
			this.els.sts.textContent = secondaryTimestamp;
			this.stStr = secondaryTimestamp;
			this.handleWideSts();

			// Color
			const styles = timeColors(diff);
			for (var property in styles) {
				if (this.root.style[property] !== styles[property]) {
					this.root.style[property] = styles[property];
				}
			}
		}

		this.timeoutId = setTimeout(this.tick, 10000);
	}

	handleWideSts() {
		// Handle abnormally long strings in the STS
		if (this.root) {
			if (this.stStr && this.stStr.length > 6) {
				if (this.els.sts) {
					const stsWidth = this.els.sts.getBoundingClientRect().width;
					if (stsWidth > 35) {
						this.root.style.paddingRight = (stsWidth + 15) + "px";
						return;
					}
				}
			}

			if (this.root.style.paddingRight) {
				this.root.style.paddingRight = "";
			}
		}
	}

	flash() {
		let { deviceVisible, visible } = this.props;
		if (this.root && deviceVisible && visible) {
			this.root.className = this.renderClassName(true);
			this.flashTimeout = setTimeout(this.endFlash, 200);
		}
	}

	endFlash() {
		if (this.root) {
			this.root.className = this.renderClassName(false);
		}
	}

	renderSecondaryTimestamp(date, timeInfo) {
		var sts = timeStamp(date, false);
		const now = new Date();
		const yesterdayMidnight = midnightDate(prevDay(now));

		if (!timeInfo) {
			const diff = Math.abs(now - date);
			timeInfo = formatTime(diff);
		}

		// Add "yesterday" to times that could've been interpreted to be today
		if (timeInfo.day === 1 && yesterdayMidnight < date) {
			sts = "yesterday " + sts;
		}

		// If the date is before yesterday midnight, abort even write anything
		if (yesterdayMidnight > date) {
			sts = "";
		}

		return sts;
	}

	renderClassName(flashing = false) {
		const { className: givenClassName } = this.props;

		var classNames = ["itemlist__item"];

		if (givenClassName) {
			classNames.push(givenClassName);
		}

		if (flashing) {
			classNames.push("flash");
		}

		if (typeof this.stStr === "string" && !this.stStr) {
			classNames.push("notime");
		}

		return classNames.join(" ");
	}

	render() {
		const { prefix, skipOld = true, style: givenStyle, suffix, time } = this.props;
		const { shieldedNow } = this.state;

		const now = Date.now();

		var primaryTimeEl = null, secondaryTimeEl = null, styles;

		// If time is known at all
		if (time) {
			const then = this.date;
			const diff = now - then;
			const timeInfo = formatTime(diff);

			// Skip people who haven't been here for a certain amount of days :(

			if (skipOld && timeInfo.day >= 3) {
				return null;
			}

			// Display values
			const secondaryTimestamp = this.renderSecondaryTimestamp(then, timeInfo);
			styles = timeColors(diff);

			this.stStr = secondaryTimestamp;

			// Live timestamp
			if (shieldedNow) {
				primaryTimeEl = <span className="now" key="now">now</span>;
			}
			else {
				primaryTimeEl = <TimeAgo date={time} formatter={formatter} />;
			}

			secondaryTimeEl = (
				<div className="ts" ref={this.setSts}>
					{ secondaryTimestamp }
				</div>
			);
		} else {

			if (skipOld) {
				return null;
			}

			const nullDate = new Date("1970-01-01 00:00:00");
			styles = timeColors(now - nullDate);
			this.stStr = "";
		}

		// Class names

		var className = this.renderClassName();

		this.hasRenderedOnce = true;

		if (givenStyle) {
			styles = { ...styles, ...givenStyle };
		}

		return (
			<div className={className} style={styles}>
				<div className="l">
					{ prefix }
					{ prefix && primaryTimeEl ? " " : null }
					{ primaryTimeEl }
					{ suffix ? " " : null }
					{ suffix }
				</div>
				{ secondaryTimeEl }
			</div>
		);
	}
}

TimedItem.propTypes = {
	className: PropTypes.string,
	deviceVisible: PropTypes.bool,
	enableDarkMode: PropTypes.bool,
	prefix: PropTypes.node,
	skipOld: PropTypes.bool,
	style: PropTypes.object,
	suffix: PropTypes.node,
	time: PropTypes.string,
	visible: PropTypes.bool
};

export default connect(({
	appConfig: { enableDarkMode },
	deviceState: { visible }
}) => ({
	deviceVisible: visible,
	enableDarkMode
}))(TimedItem);
