const { URL } = require("url");

const _ = require("lodash");
const request = require("request");

// Create a queue to prevent multiple http requests to the same host per second

const CHECK_REQUESTS_INTERVAL_MS = 500;

var requestQueue = {}; // Format: { host: [requests...] }
var numQueued = 0;

function queueRequest(options, callback) {
	let urlString = options && options.url;
	var url;

	try {
		url = new URL(urlString);
	}
	catch (e) {
		// Call immediately and don't give a fuck
		return request(options, callback);
	}

	let host = url.host || "(anonymous)";

	if (!requestQueue[host]) {
		requestQueue[host] = [];
	}

	requestQueue[host].push({ options, callback });
	numQueued++;
}

function fireQueuedRequests() {
	// Take one per host and fire it off
	if (numQueued > 0) {
		_.forOwn(requestQueue, function(requestList/*, host*/) {
			let r = requestList.shift();

			if (r) {

				/*console.log(
					"Firing off request to " + host +
					" (" + requestList.length + " remaining, " +
					(numQueued - 1) + " total remaining)"
				);*/

				let { options, callback } = r;
				request(options, callback);
				numQueued--;
			}
		});
	}
}

setInterval(fireQueuedRequests, CHECK_REQUESTS_INTERVAL_MS);

module.exports = { queueRequest };
