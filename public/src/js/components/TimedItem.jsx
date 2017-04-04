import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import { findDOMNode } from "react-dom";
import moment from "moment";
import TimeAgo from "react-timeago";

import { formatTime, timeColors } from "../lib/formatting";

// Custom timeago formatter to reduce granularity for really recent events

const lessGranularFormatter = (value, unit, suffix, date, defaultFormatter) => {
	if (unit === "second") {
		if (value < 30) {
			return "a few seconds " + suffix;
		}
		else {
			return "1 minute " + suffix;
		}
	}

	return defaultFormatter(value, unit, suffix, date);
};

class TimedItem extends PureComponent {

	constructor(props) {
		super(props);

		this.flash = this.flash.bind(this);
		this.renderClassName = this.renderClassName.bind(this);
	}

	componentDidMount() {
		const root = findDOMNode(this);
		if (root) {
			// Store the root
			this.root = root;

			// Piggybacking onto livestamp changes through jQuery
			/*window.jQuery("time", root).on("change.livestamp", () => {
				if (this.refs && this.refs.time && this.refs.sts) {
					const dt = this.refs.time.getAttribute("datetime");

					// Cache the moment object
					var m;
					if (this._dt === dt && this._m) {
						m = this._m;
					} else {
						m = this._m = moment(dt);
						this._dt = dt;
					}

					const ms = moment().diff(m);
					const timeInfo = formatTime(ms);

					this.refs.sts.textContent = this.renderSecondaryTimestamp(m, timeInfo);
					const styles = timeColors(m, ms);
					for(var property in styles) {
						root.style[property] = styles[property];
					}
				}
			});*/

			this.handleWideSts();
		}
	}

	componentWillReceiveProps(newProps) {
		if (newProps) {
			const { time: oldTime } = this.props;
			const { time: newTime } = newProps;

			if (oldTime !== newTime) {
				// Do a lil' flash!
				this.flash();
			}
		}
	}

	componentDidUpdate() {
		this.handleWideSts();
	}

	handleWideSts() {
		// Handle abnormally long strings in the STS
		if (this.root) {
			if (this.stStr && this.stStr.length > 6) {
				if (this.refs.sts) {
					const stsWidth = this.refs.sts.getBoundingClientRect().width;
					if (stsWidth > 35) {
						this.root.style.paddingRight = (stsWidth + 15) + "px";
						return;
					}
				}
			}

			this.root.style.paddingRight = "";
		}
	}

	flash() {
		if (this.root) {
			this.root.className = this.renderClassName(true);
			setTimeout(() => {
				if (this.root) {
					this.root.className = this.renderClassName(false);
				}
			}, 200);
		}
	}

	renderSecondaryTimestamp(m, timeInfo) {
		var sts = m.format("H:mm");
		const ym = moment().subtract(1, "days").startOf("day");

		if (timeInfo.day === 1 && ym < m) {
			sts = "yesterday " + sts;
		}

		// If the date is before yesterday midnight, it's earlier than yesterday.
		if (ym > m) {
			sts = "";
		}

		return sts;
	}

	renderClassName(flashing = false) {
		const { className: givenClassName } = this.props;

		var classNames = [];

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
		const { prefix, skipOld = true, suffix, time } = this.props;

		var primaryTimeEl = null, secondaryTimeEl = null, styles;

		// If time is known at all
		if (time) {
			const m = moment(time);
			const ms = moment().diff(m);
			const timeInfo = formatTime(ms);

			// Skip people who haven't been here for a certain amount of days :(

			if (skipOld && timeInfo.day >= 3) {
				return null;
			}

			// Display values
			const secondaryTimestamp = this.renderSecondaryTimestamp(m, timeInfo);
			styles = timeColors(m, ms);

			this.stStr = secondaryTimestamp;

			// Live timestamp
			primaryTimeEl = <TimeAgo date={time} formatter={lessGranularFormatter} />;
			secondaryTimeEl = <div className="ts" ref="sts">{ secondaryTimestamp }</div>;
		} else {

			if (skipOld) {
				return null;
			}

			const nullMoment = moment("1970-01-01 00:00:00");
			styles = timeColors(nullMoment, moment().diff(nullMoment));
			this.stStr = "";
		}

		// Class names

		var className = this.renderClassName();

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
	enableDarkMode: PropTypes.bool,
	prefix: PropTypes.node,
	skipOld: PropTypes.bool,
	suffix: PropTypes.node,
	time: PropTypes.string
};

export default connect(({ appConfig: { enableDarkMode }}) => ({ enableDarkMode }))(TimedItem);
