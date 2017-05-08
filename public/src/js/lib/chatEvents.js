import pickBy from "lodash/pickBy";

const PART_EVENT_TYPES = ["part", "quit", "kick", "kill"];
const JOIN_ADDEND = 1;
const PART_ADDEND = -1;

export function prepareBunchedEvents(event, collapseJoinParts) {
	var joins = [], parts = [], eventOrder = [], earliestTime = event.firstTime, latestTime;

	const overloaded = event.events.length < event.joinCount + event.partCount;

	event.events.sort((a, b) => a.time - b.time);

	const userStatus = {};

	event.events.forEach((event) => {
		if (event) {
			let { time, type, username } = event;

			if (!(username in userStatus)) {
				userStatus[username] = 0;
			}

			const eventName = type === "join" ? "join" : "part";
			if (type === "join") {
				joins.push(username);

				if (collapseJoinParts) {
					userStatus[username] += JOIN_ADDEND;
				}
			}
			else if (PART_EVENT_TYPES.indexOf(type) >= 0) {
				parts.push(username);

				if (collapseJoinParts) {
					userStatus[username] += PART_ADDEND;
				}
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
		joins = Object.keys(pickBy(userStatus, (value) => value > 0));
		parts = Object.keys(pickBy(userStatus, (value) => value < 0));
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
