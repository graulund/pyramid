import React, { PureComponent } from "react";
import PropTypes from "prop-types";

class Loader extends PureComponent {
	render() {
		const { className = "loader" } = this.props;

		return <div className={className}></div>;
	}
}

Loader.propTypes = {
	className: PropTypes.string
};

export default Loader;
