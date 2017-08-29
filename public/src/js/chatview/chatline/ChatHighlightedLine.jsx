import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { refElSetter } from "../../lib/refEls";

class ChatHighlightedLine extends PureComponent {
	constructor(props) {
		super(props);

		this.onUnobserved = this.onUnobserved.bind(this);

		this.els = {};
		this.setRoot = refElSetter("root").bind(this);
	}

	componentDidMount() {
		this.toggleObservation(
			this.isUnseen(this.props),
			false
		);
	}

	componentDidUpdate(prevProps) {
		this.toggleObservation(
			this.isUnseen(this.props),
			this.isUnseen(prevProps)
		);
	}

	componentWillUnmount() {
		if (this.observed) {
			this.unobserve();
		}
	}

	isUnseen(props = this.props) {
		let { lineId, unseenHighlights } = props;

		return lineId &&
			unseenHighlights &&
			unseenHighlights.length &&
			unseenHighlights.indexOf(lineId) >= 0;
	}

	observe() {
		let { lineId, observer } = this.props;

		if (observer) {
			let { root } = this.els;

			if (root) {
				// Adding extra info to root
				root.onUnobserve = this.onUnobserved;
				root.lineId = lineId;

				// Observing
				observer.observe(root);
				this.observed = true;
			}
		}
		else {
			console.warn(
				"Tried to observe in HighlightObserver, " +
				"but no observer was supplied"
			);
		}
	}

	toggleObservation(onNow, onThen) {
		if (onNow !== onThen) {
			if (onNow) {
				this.observe();
			}
			else {
				this.unobserve();
			}
		}
	}

	unobserve() {
		let { observer } = this.props;
		let { root } = this.els;

		if (root && observer) {
			observer.unobserve(root);
			this.onUnobserved();
		}
	}

	onUnobserved() {
		this.observed = false;
	}

	render() {
		let { children, className: givenClassName, id } = this.props;
		let unseen = this.isUnseen(this.props);

		let itemProps = {
			className: givenClassName +
				(unseen ? " line--unseen-highlight" : ""),
			id,
			ref: this.setRoot
		};

		return <li {...itemProps}>{ children }</li>;
	}
}

ChatHighlightedLine.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
	id: PropTypes.string,
	lineId: PropTypes.string.isRequired,
	observer: PropTypes.object.isRequired,
	unseenHighlights: PropTypes.array
};

export default connect(
	({ unseenHighlights }) => ({ unseenHighlights })
)(ChatHighlightedLine);
