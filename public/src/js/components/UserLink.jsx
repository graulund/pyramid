import React, { PureComponent, PropTypes } from "react";
import { Link } from "react-router";

import { internalUrl } from "../lib/formatting";

class UserLink extends PureComponent {
	render() {
		const { className, userName } = this.props;

		if (!userName) {
			return null;
		}

		return (
			<Link
				className={className}
				to={internalUrl("/user/" + userName.toLowerCase())}>
				{ userName }
			</Link>
		);
	}
}

UserLink.propTypes = {
	className: PropTypes.string,
	userName: PropTypes.string.isRequired
};

export default UserLink;
