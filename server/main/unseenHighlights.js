module.exports = function(io) {
	var unseenHighlightIds = new Set();

	// See an unseen highlight

	const reportHighlightAsSeen = function(messageId) {
		if (messageId) {
			unseenHighlightIds.delete(messageId);

			if (io) {
				io.emitUnseenHighlights();
			}
		}
	};

	const addUnseenHighlightId = function(highlightId) {
		unseenHighlightIds.add(highlightId);
	};

	const clearUnseenHighlights = function() {
		unseenHighlightIds.clear();

		if (io) {
			io.emitUnseenHighlights();
		}
	};

	return {
		addUnseenHighlightId,
		clearUnseenHighlights,
		reportHighlightAsSeen,
		unseenHighlightIds: () => unseenHighlightIds
	};
};
