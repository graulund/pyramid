import React, { PureComponent, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import { connect } from "react-redux";

class HighlightObserver extends PureComponent {
	constructor(props) {
		super(props);

		this.onUnobserved = this.onUnobserved.bind(this);
	}

	componentDidMount () {
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
		const { lineId, unseenHighlights } = props;

		return lineId &&
			unseenHighlights &&
			unseenHighlights.length &&
			unseenHighlights.indexOf(lineId) >= 0;
	}

	observe() {
		const { lineId, observer } = this.props;

		if (observer) {
			const root = findDOMNode(this);

			if (root) {
				// Adding extra info to root
				root.onUnobserve = this.onUnobserved;
				root.lineId = lineId;

				// Setting root
				this.root = root;

				// Observing
				observer.observe(root);
				this.observed = true;
			}
		}
		else {
			console.warn("Tried to observe in HighlightObserver, but no observer was supplied");
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
		const { observer } = this.props;

		if (this.root && observer) {
			observer.unobserve(this.root);
			this.onUnobserved();
		}
	}

	onUnobserved() {
		this.observed = false;
	}

	render() {
		const { children } = this.props;
		const unseen = this.isUnseen(this.props);
		return (
			<span
				className={unseen ? "unseenhighlight" : null}
				key="highlightobserver">
				{ children }
			</span>
		);
	}
}

HighlightObserver.propTypes = {
	children: PropTypes.node.isRequired,
	lineId: PropTypes.string.isRequired,
	observer: PropTypes.object,
	unseenHighlights: PropTypes.array
};

export default connect(({ unseenHighlights }) => ({ unseenHighlights }))(HighlightObserver);
