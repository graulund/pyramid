// PYRAMID

// DEBUG TEMP START

const optional = require("optional");
const heapdump = optional("heapdump");

if (heapdump) {
	console.log(
		"Heap dumps enabled! If this process is acting up, " +
		`run:\n\tkill -USR2 ${process.pid}\n` +
		"And then send the resulting heapdump file to the developer.\n" +
		"This helps us improve the app.\n\n" +
		"Thanks for trying out Pyramid!\n"
	);
}

// DEBUG TEMP END

// Main app service
const main = require("./server/main");

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

module.exports = main;
