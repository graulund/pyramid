const parseBadgeCode = function(badgeCode) {
	let data = badgeCode.split("/");
	return { badge: data[0], version: data[1] };
};

const parseBadgeCodes = function(badgeCodesString) {
	if (!badgeCodesString) {
		return [];
	}

	let badgeCodes = badgeCodesString.split(",");
	return badgeCodes.map(parseBadgeCode);
};

const parseBadgesInTags = function(tags) {
	if (!tags) {
		return;
	}

	if (tags.badges) {
		if (typeof tags.badges === "string") {
			tags.badges = parseBadgeCodes(tags.badges);
		}
	}
	else if ("badges" in tags) {
		// Type normalization
		tags.badges = [];
	}
};

module.exports = {
	parseBadgeCodes,
	parseBadgesInTags
};
