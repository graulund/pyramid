// Main app service
const main = require("./server/main");

function init() {
	// Feed app into DB service
	require("./server/db")(main);

	// Feed app into plugin service
	require("./server/plugins")(main);

	// Feed app into IRC service
	require("./server/irc")(main);

	// IO service
	const io = require("./server/io")(main);

	// Start web service
	require("./server/web")(main, io);
}

module.exports = { init, main };
