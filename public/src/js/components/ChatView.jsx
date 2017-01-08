import React, { Component, PropTypes } from "react";

class ChatView extends Component {
	componentDidMount () {
		const { params } = this.props;
		console.log("ChatView opened with params:", params);
	}
	render() {
		return (
			<div id="chatview" className="chatview">
				<h1>tricked LUL</h1>
			</div>
		);
	}
}

ChatView.propTypes = {
	params: PropTypes.object
};

export default ChatView;
