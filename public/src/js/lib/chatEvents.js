import pickBy from "lodash/pickBy";

const PART_EVENT_TYPES = ["part", "quit", "kick", "kill"];
const JOIN_ADDEND = 1;
const PART_ADDEND = -1;

export function prepareBunchedEvents(event, collapseJoinParts) {
	var joins = [],
		parts = [],
		eventOrder = [],
		earliestTime = event.firstTime,
		latestTime;

	const overloaded =
		event.events.length < event.joinCount + event.partCount;

	event.events.sort((a, b) => a.time - b.time);

	const userStatus = {};
	const userInfos = {};

	const addToLists = (list, addendValue, username, displayName) => {
		let userInfo = { displayName, username };
		list.push(userInfo);
		userInfos[username] = userInfo;

		if (collapseJoinParts) {
			userStatus[username] += addendValue;
		}
	};

	event.events.forEach((event) => {
		if (event) {
			let { displayName, time, type, username } = event;

			if (!(username in userStatus)) {
				userStatus[username] = 0;
			}

			const eventName = type === "join" ? "join" : "part";
			if (type === "join") {
				addToLists(joins, JOIN_ADDEND, username, displayName);
			}
			else if (PART_EVENT_TYPES.indexOf(type) >= 0) {
				addToLists(parts, PART_ADDEND, username, displayName);
			}
			else {
				return;
			}

			if (eventOrder.indexOf(eventName) < 0) {
				eventOrder.push(eventName);
			}

			if (!earliestTime || time < earliestTime) {
				earliestTime = time;
			}

			if (!latestTime || time > latestTime) {
				latestTime = time;
			}
		}
	});

	if (collapseJoinParts && !overloaded) {
		joins = Object.keys(pickBy(userStatus, (value) => value > 0))
			.map((username) => userInfos[username]);
		parts = Object.keys(pickBy(userStatus, (value) => value < 0))
			.map((username) => userInfos[username]);
	}

	return {
		earliestTime,
		eventOrder,
		joins,
		latestTime,
		overloaded,
		parts
	};
}
