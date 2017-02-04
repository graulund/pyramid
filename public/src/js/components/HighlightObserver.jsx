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
		const { id, unseenHighlights } = props;

		return id &&
			unseenHighlights &&
			unseenHighlights.length &&
			unseenHighlights.indexOf(id) >= 0;
	}

	observe() {
		const { id, observer } = this.props;

		if (observer) {
			const root = findDOMNode(this);

			if (root) {
				// Adding extra info to root
				root.onUnobserve = this.onUnobserved;
				root.messageId = id;

				// Setting root
				this.root = root;

				// Observing
				observer.observe(root);
				this.observed = true;
			}
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
		if (this.root && this.props.observer) {
			this.props.observer.unobserve(this.root);
			this.onUnobserved();
		}
	}

	onUnobserved() {
		this.observed = false;
	}

	render() {
		return <span key="highlightobserver">{ this.props.children }</span>;
	}
}

HighlightObserver.propTypes = {
	children: PropTypes.node.isRequired,
	id: PropTypes.string,
	observer: PropTypes.object,
	unseenHighlights: PropTypes.array
};

export default connect(({ unseenHighlights }) => ({ unseenHighlights }))(HighlightObserver);
