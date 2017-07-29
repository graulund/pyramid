import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatWindowMenu from "./ChatWindowMenu.jsx";

class NoChatView extends PureComponent {
	render() {
		const { index, notFound } = this.props;
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

		return (
			<div className="mainview nochatview">
				{ content }
				<ChatWindowMenu index={index} />
			</div>
		);
	}
}

NoChatView.propTypes = {
	index: PropTypes.number,
	notFound: PropTypes.bool
};

export default NoChatView;
