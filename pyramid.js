// IRC WATCHER

// Configuration
var config = require("./config")

// Utilities
var util   = require("./util")(config)

// Logging service
var log    = require("./log")(config, util)

// IRC service
var irc    = require("./irc")(config, util, log)

// IO service
var io     = require("./io")(config, util, log, irc)

// Web service
var web    = require("./web")(config, util, log, irc, io)
