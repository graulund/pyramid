const fs = require("fs");
const https = require("https");
const path = require("path");

const chokidar = require("chokidar");

var server, keyPath, certPath, webPort, app;
var fileChanges = { key: false, cert: false };

function watchCertFile(filename, name) {
	var watcher = chokidar.watch(filename, { ignoreInitial: true });

	watcher.on("change", function () {
		if (name) {
			registerCertFileChange(name);
		}
	});

	watcher.on("add", function () {
		if (name) {
			registerCertFileChange(name);
		}
	});
}

function registerCertFileChange(name) {
	fileChanges[name] = true;

	if (fileChanges.key && fileChanges.cert) {
		// Restart server if the key and cert changed in the file system

		fileChanges.key = false;
		fileChanges.cert = false;

		let keyData = getKeyData();
		let certData = getCertData();

		if (
			server &&
			keyData &&
			keyData.length &&
			certData &&
			certData.length
		) {
			console.log("Restarting HTTPS server due to new key/cert pair...");

			server.close();
			startServer(keyData, certData);
		}
	}
}

function getKeyData() {
	return fs.readFileSync(path.join(__dirname, "..", keyPath));
}

function getCertData() {
	return fs.readFileSync(path.join(__dirname, "..", certPath));
}

function startServer(keyData, certData) {
	server = https.createServer(
		{ key: keyData, cert: certData },
		app
	).listen(webPort, undefined, undefined, function(){
		console.log("Listening securely on port %d", server.address().port);
	});

	return server;
}

function setUp(values) {
	keyPath = values.keyPath;
	certPath = values.certPath;
	webPort = values.webPort;
	app = values.app;

	watchCertFile(keyPath, "key");
	watchCertFile(certPath, "cert");

	let keyData = getKeyData();
	let certData = getCertData();
	return startServer(keyData, certData);
}

module.exports = setUp;
