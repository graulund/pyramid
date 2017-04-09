import timeZoneData from "./timeZoneData";

export function timeZoneList() {
	const rawList = timeZoneData;

	// Put the "other" category at the bottom
	const other = rawList.filter(
		(tz) => (tz.indexOf("/") < 0 || tz.substr(0, 4) === "Etc/") && tz !== "UTC"
	);
	const nonOther = rawList.filter(
		(tz) => tz.indexOf("/") >= 0 && tz.substr(0, 4) !== "Etc/"
	);

	// UTC at the top
	return ["UTC"].concat(nonOther.concat(other));
}

function beautifyTimeZoneName(tz) {
	return tz

		// Convert underscores to spaces
		.replace(/_/g, " ")

		// Convert subdir slashes to prefix separators
		.replace(/\//g, ": ")

		// Find implied spaces (lowercase char followed by uppercase char)
		.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function timeZoneFormattedList() {
	const list = timeZoneList();
	return list.map((tz) => [ tz, beautifyTimeZoneName(tz) ]);
}
