// PYRAMID

// Configuration
var config = require("./config");

// Utilities
var util   = require("./server/util");

// Logging service
var log    = require("./server/log");

// IRC service
var irc    = require("./server/irc")(log);

// IO service
var io     = require("./server/io")(log, irc);

// Web service
var web    = require("./server/web")(log, irc, io);
