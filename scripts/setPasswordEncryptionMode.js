const lodash = require("lodash");

//const config = require("../config");
const dbSource = require("../server/db");
const readline = require("readline");
const Writable = require("stream").Writable;

const mutableStdout = new Writable({
	write: function(chunk, encoding, callback) {
		if (!this.muted) {
			process.stdout.write(chunk, encoding);
		}

		callback();
	}
});

/*process.stdout.write("Password: ");

process.stdin.setEncoding("utf8");

process.stdin.on("readable", () => {
	var chunk = process.stdin.read();
	if (chunk !== null) {
		process.stdout.write(`data: ${chunk}`);
	}
});

process.stdin.on("end", () => {
	process.stdout.write("end");
});*/

const passwordUtils = require("../server/util/passwords");

var db;

function askForPassword (storedPassword, db) {
	console.log("This script changes your Pyramid's IRC password encryption mode.");
	console.log("First, we need your Pyramid password. Type it in the following prompt and type enter, but be aware that your input cannot be seen.");
	console.log("");

	const rl = readline.createInterface({
		input: process.stdin,
		output: mutableStdout,
		terminal: true
	});

	rl.question("Password: ", (givenPassword) => {
		rl.close();
		process.stdout.write("\n");
		handleGivenPassword(givenPassword, storedPassword, db);
	});

	mutableStdout.muted = true;
}

function handleGivenPassword (givenPassword, storedPassword, db) {
	if (givenPassword === storedPassword) {
		// It is currently stored in plain text

		let passwordHash = passwordUtils.generatePasswordHash(givenPassword);

		// First, hash the password
		db.storeConfigValue("webPassword", passwordHash, (err) => {
			if (err) {
				throw err;
			}
			else {
				// Continue
				askForPreference(givenPassword, db);
			}
		});
	}

	else if (passwordUtils.verifyPassword(givenPassword, storedPassword)) {
		console.log("hashed");
		// It is currently stored as a hash
		// Continue directly
		askForPreference(givenPassword, db);
	}

	else {
		console.log("Password incorrect. Aborting.");
	}
}

function askForPreference (decryptedPassword, db) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	console.log("Until now, all IRC passwords in Pyramid have been stored in plain text.");

	console.log("The newest version of Pyramid introduces a choice between two IRC password encryption modes.");
	console.log("");

	console.log("1. The secure mode, which relies on a key that is not present in the database, but requires that you log in to the Pyramid web interface at least once before it can connect to IRC networks requiring passwords for authentication.");
	console.log("");

	console.log("2. The less secure mode, which relies on a key that is easily findable for any person who would access your database (thus too easily decryptable to call anything other than a convenience encryption), but connects to IRC networks requiring passwords for authentication immediately upon startup.");
	console.log("");

	console.log("Default value is the less secure mode, since that's the way Pyramid has worked so far, but it's not very recommendable.");

	rl.question("Do you wish to use the secure mode? [y/n]: ", (preference) => {
		rl.close();
		process.stdout.write("\n");
		handlePreference(preference, decryptedPassword, db);
	});
}

function handlePreference (preference, decryptedPassword, db) {
	preference = preference.toLowerCase();
	var isStrong;

	if (preference === "y") {
		// Secure mode
		isStrong = true;
	}
	else if (preference === "n") {
		// Non-secure mode
		isStrong = false;
	}
	else {
		console.log("Incorrect choice. Aborting.");
		return;
	}

	db.storeConfigValue("strongIrcPasswordEncryption", isStrong, (err) => {
		if (err) {
			throw err;
		}
		else {
			// ENCRYPT THE PASSWORDS

			console.log("Setting stored. Please ensure that you restart your Pyramid instance before using it again.");
		}
	});
}

// Init

dbSource({ setDb: (_) => { db = _; } }, () => {

	db.getConfigValue("webPassword", (err, storedPassword) => {
		if (err) {
			throw err;
		}
		else {
			askForPassword(storedPassword, db);
		}
	});


/*
	var keyValues = lodash.omit(config, [
		// Properties handled separately
		"irc", "nicknames", "friends", "bestFriends",
		// No longer a thing
		"debug", "encoding", "nonPeople"
	]);

	// Key values
	lodash.forOwn(keyValues, (value, key) => {
		console.log("Adding key " + key);
		db.storeConfigValue(key, value, callback);
	});

	// IRC config
	if (config.irc && config.irc.length) {
		var serverId = 0;
		config.irc.forEach((server) => {
			serverId++;
			var serverData = lodash.omit(server, ["channels"]);
			serverData.hostname = serverData.hostname || serverData.server;
			serverData.nickname = serverData.nickname || serverData.username;
			console.log("Adding server " + server.name);
			db.addServerToIrcConfig(serverData, callback);

			if (server.channels && server.channels.length) {
				server.channels.forEach((channel) => {
					console.log("Adding channel " + channel);
					db.addChannelToIrcConfig(
						serverId, channel.replace(/^#/, ""), callback
					);
				});
			}
		});
	}*/
});
