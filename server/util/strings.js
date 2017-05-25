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

module.exports = {
	clean,
	formatUriName,
	lowerClean,
	normalise,
	oneWord
};
