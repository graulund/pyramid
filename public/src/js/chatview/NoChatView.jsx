import React, { PureComponent } from "react";
import PropTypes from "prop-types";

class NoChatView extends PureComponent {
	render() {
		const { notFound } = this.props;
		var content;

		if (notFound) {
			content = [
				<h1 key="0">Huh…</h1>,
				<h2 key="1">Couldn’t find that channel or user :(</h2>
			];
		}

		else {
			content = <h1>Open a chat :)</h1>;
		}

		return <div className="mainview nochatview">{ content }</div>;
	}
}

NoChatView.propTypes = {
	notFound: PropTypes.bool
};

export default NoChatView;
