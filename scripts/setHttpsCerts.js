const async = require("async");
const readline = require("readline");

const dbSource = require("../server/db");

var db;

function askForPreference() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	console.log("This is the script that helps you install/uninstall HTTPS certificates for your Pyramid server.");
	console.log("");

	rl.question(
		"Do you wish to use certificates? [y/n]: ",
		(preference) => {
			rl.close();
			process.stdout.write("\n");
			handlePreference(preference);
		}
	);
}

function handlePreference(preference) {
	preference = preference.toLowerCase();
	var useSSL;

	if (preference === "y") {
		useSSL = true;
	}
	else if (preference === "n") {
		useSSL = false;
	}
	else {
		console.log("Please start over, and this time, type either y or n.");
		return;
	}

	if (useSSL) {
		askForFileNames();
	}

	else {
		// Set both file names to ""
		console.log("Uninstalling certificates.");
		setFileNames("", "");
	}
}

function askForFileNames() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	console.log("");
	console.log("Type the paths, relative to the Pyramid main folder, to your TLS key and certificate files. To make it really easy, you could put them in the main folder and then just type their file names here.");
	console.log("");

	rl.question(
		"HTTPS key file path: ",
		(key) => {
			process.stdout.write("\n");
			rl.question(
				"HTTPS cert file path: ",
				(cert) => {
					rl.close();
					process.stdout.write("\n");
					setFileNames(key, cert);
				}
			);
		}
	);
}

function setFileNames(key, cert) {
	async.parallel([
		(callback) => db.storeConfigValue("httpsKeyPath", key, callback),
		(callback) => db.storeConfigValue("httpsCertPath", cert, callback)
	], function(err) {
		if (err) {
			throw err;
		}
		else {
			console.log("Done. Restart your Pyramid instance if it's already running, and make sure to use either https or http depending on what you just chose.");
		}
	});
}

// Init

dbSource({ setDb: (_) => { db = _; } }, () => {
	askForPreference();
});
