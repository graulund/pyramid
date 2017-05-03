import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import { LOG_PAGE_SIZE } from "../constants";

const EDGE_NUM_PAGES = 2;

class ChatViewLogPagination extends PureComponent {
	render() {
		const { logDate, logDetails, logUrl, pageNumber } = this.props;

		if (logDate && logDetails && logDetails[logDate]) {
			const lines = logDetails[logDate];

			const numPages = Math.ceil(lines / LOG_PAGE_SIZE);

			var lastNumberShown = 0;
			const numbersShown = [];
			const edgePoints = [1];

			if (pageNumber && edgePoints.indexOf(pageNumber) < 0) {
				edgePoints.push(pageNumber);
			}

			if (edgePoints.indexOf(numPages) < 0) {
				edgePoints.push(numPages);
			}

			const pagesEls = [];

			// Prev button

			if (pageNumber > 1) {
				let prevUrl = logUrl(logDate, pageNumber - 1);
				pagesEls.push((
					<li className="prev" key="prev">
						<Link to={prevUrl}>
							&larr;<span>&nbsp;Previous</span>
						</Link>
					</li>
				));
				pagesEls.push(" ");
			}

			// Page buttons

			edgePoints.forEach((point) => {
				for (
					var i = point - EDGE_NUM_PAGES;
					i <= point + EDGE_NUM_PAGES;
					i++
				) {
					if (
						i > 0 &&
						i <= numPages &&
						numbersShown.indexOf(i) < 0
					) {
						// Prefix
						if (i - lastNumberShown > 1) {
							pagesEls.push((
								<li className="sep" key={i + "-prefix"}>
									...
								</li>
							));
						}

						// Current page
						if (i === pageNumber) {
							pagesEls.push((
								<li key={i}>
									<strong>{ i }</strong>
								</li>
							));
						}

						// Other page
						else {
							let url = logUrl(logDate, i);
							pagesEls.push((
								<li key={i}>
									<Link to={url}>{ i }</Link>
								</li>
							));
						}

						// Update cache vars
						numbersShown.push(i);
						lastNumberShown = i;
					}
				}
			});

			// Next button

			if (pageNumber < numPages) {
				let nextUrl = logUrl(logDate, pageNumber + 1);
				pagesEls.push(" ");
				pagesEls.push((
					<li className="next" key="next">
						<Link to={nextUrl}>
							<span>Next&nbsp;</span>&rarr;
						</Link>
					</li>
				));
			}

			return (
				<div className="chatview__pagination">
					<ul>
						{ pagesEls }
					</ul>
				</div>
			);
		}

		return null;
	}
}

ChatViewLogPagination.propTypes = {
	logDate: PropTypes.string,
	logDetails: PropTypes.object,
	logUrl: PropTypes.func,
	pageNumber: PropTypes.number
};

export default ChatViewLogPagination;
