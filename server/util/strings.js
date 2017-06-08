// Sanitizing

const normalise = function(s) {
	if (s && s.replace) {
		return s.replace(/\s+/g, " ");
	}

	return "";
};

const clean = function(s) {
	if (s && s.trim) {
		return normalise(s).trim();
	}

	return "";
};

const oneWord = function(s) {
	const cleanedString = clean(s);

	// Only return the first word in the string, for strings where space is not allowed
	if (cleanedString) {
		return cleanedString.replace(/\s.*$/, "");
	}

	return "";
};

const formatUriName = function(s) {
	const oneWordString = oneWord(s);

	// No slashes allowed, and all lowercase
	if (oneWordString) {
		return oneWordString.replace(/\//g, "").toLowerCase();
	}

	return "";
};

const lowerClean = function(s) {
	const cleanedString = clean(s);

	// All lowercase
	if (cleanedString) {
		return cleanedString.toLowerCase();
	}

	return "";
};

// Misc

const pluralize = function(value, base, addition) {
	// Example: 8, "banana", "s", returns either "banana" or "bananas"

	value = parseInt(value, 10);

	if (value === 1) {
		return base;
	}

	return base + addition;
};

module.exports = {
	clean,
	formatUriName,
	lowerClean,
	normalise,
	oneWord,
	pluralize
};
