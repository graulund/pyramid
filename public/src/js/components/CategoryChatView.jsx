import React, { Component, PropTypes } from "react";

//import ChatView from "./components/ChatView.jsx";

class CategoryChatView extends Component {
	render() {
		//return <ChatView params={this.props.params} />;
		return <div id="chatview" className="chatview"><h1>:o</h1></div>;
	}
}

CategoryChatView.propTypes = {
	params: PropTypes.object
};

export default CategoryChatView;
