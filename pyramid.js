// PYRAMID

// Main app service
const main = require("./server/main");

// Feed app into IRC service
require("./server/irc")(main);

// IO service
const io = require("./server/io")(main);

// Start web service
require("./server/web")(main, io);
