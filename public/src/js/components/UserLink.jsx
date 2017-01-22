import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import { Link } from "react-router";

import { userUrl } from "../lib/routeHelpers";

class UserLink extends PureComponent {
	render() {
		const { className, friendsList, userName } = this.props;

		if (!userName) {
			return null;
		}

		// Does this user exist in the friends list?

		var isFriend = false;

		for (var list in friendsList) {
			if (friendsList.hasOwnProperty(list)) {
				if (friendsList[list].indexOf(userName) >= 0) {
					isFriend = true;
					break;
				}
			}
		}

		// Link-free output for non-friends

		if (!isFriend) {
			return <span>{ userName }</span>;
		}

		// Link output for friends

		return (
			<Link
				className={className}
				to={userUrl(userName)}>
				{ userName }
			</Link>
		);
	}
}

UserLink.propTypes = {
	className: PropTypes.string,
	friendsList: PropTypes.object,
	userName: PropTypes.string.isRequired
};

export default connect(({ friendsList }) => ({ friendsList }))(UserLink);
