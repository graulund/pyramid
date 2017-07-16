import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import ChatViewLink from "../components/ChatViewLink.jsx";
import { LOG_PAGE_SIZE } from "../constants";

const EDGE_NUM_PAGES = 2;

class ChatViewLogPagination extends PureComponent {
	render() {
		const {
			logDate,
			logDetails,
			pageNumber = 1,
			pageQuery,
			pageType
		} = this.props;

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
				pagesEls.push((
					<li className="prev" key="prev">
						<ChatViewLink
							type={pageType}
							query={pageQuery}
							date={logDate}
							pageNumber={pageNumber - 1}>
							&larr;<span>&nbsp;Previous</span>
						</ChatViewLink>
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
							pagesEls.push((
								<li key={i}>
									<ChatViewLink
										type={pageType}
										query={pageQuery}
										date={logDate}
										pageNumber={i}>
										{ i }
									</ChatViewLink>
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
				pagesEls.push(" ");
				pagesEls.push((
					<li className="next" key="next">
						<ChatViewLink
							type={pageType}
							query={pageQuery}
							date={logDate}
							pageNumber={pageNumber + 1}>
							<span>Next&nbsp;</span>&rarr;
						</ChatViewLink>
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
	pageNumber: PropTypes.number,
	pageQuery: PropTypes.string,
	pageType: PropTypes.string
};

export default ChatViewLogPagination;
