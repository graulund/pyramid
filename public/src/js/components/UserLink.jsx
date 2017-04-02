import React, { PureComponent, PropTypes } from "react";
import { connect } from "react-redux";
import { Link } from "react-router";

import { userUrl } from "../lib/routeHelpers";

class UserLink extends PureComponent {
	render() {
		const { className, displayName, friendsList, userName } = this.props;

		if (!userName) {
			return null;
		}

		// If displaying display name

		var content = userName;
		if (displayName && displayName !== userName) {
			if (displayName.toLowerCase() !== userName.toLowerCase()) {
				// Totally different altogether
				content = [
					displayName + " ",
					<em>({ userName })</em>
				];
			}
			else {
				// Merely case changes
				content = displayName;
			}
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
			return <span className={className}>{ content }</span>;
		}

		// Link output for friends

		return (
			<Link
				className={className}
				to={userUrl(userName)}>
				{ content }
			</Link>
		);
	}
}

UserLink.propTypes = {
	className: PropTypes.string,
	displayName: PropTypes.string,
	friendsList: PropTypes.object,
	userName: PropTypes.string.isRequired
};

export default connect(({ friendsList }) => ({ friendsList }))(UserLink);
