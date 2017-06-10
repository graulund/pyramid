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

const passwordUtils = require("../server/util/passwords");

var db, wasStrong = false, currentlyStoredWebPassword;

function askForPassword (storedPassword) {
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
		handleGivenPassword(givenPassword, storedPassword);
	});

	mutableStdout.muted = true;
}

function handleGivenPassword (givenPassword, storedPassword) {
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
				currentlyStoredWebPassword = passwordHash;
				askForPreference(givenPassword);
			}
		});
	}

	else if (passwordUtils.verifyPassword(givenPassword, storedPassword)) {
		// It is currently stored as a hash
		// Continue directly
		askForPreference(givenPassword);
	}

	else {
		console.log("Password incorrect. Aborting.");
	}
}

function askForPreference (decryptedPassword) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	console.log("");
	console.log("Until now, all IRC passwords in Pyramid have been stored in plain text.");

	console.log("The newest version of Pyramid introduces a choice between two IRC password encryption modes.");
	console.log("");

	console.log("1. The secure mode, which relies on a key that is not present in the database, but requires that you log in to the Pyramid web interface at least once after starting it, before it can connect to IRC networks that require passwords for authentication.");
	console.log("");

	console.log("2. The insecure mode, which relies on a key that is easily findable for any person who can access your database (thus it is too easily decryptable to call it anything other than a convenience encryption). However, it connects to IRC networks requiring passwords for authentication immediately upon startup.");
	console.log("");

	console.log("Default value is the insecure mode, since that's the way Pyramid has worked so far, but it's not very recommendable.");

	rl.question("Do you wish to use the secure mode? [y/n]: ", (preference) => {
		rl.close();
		process.stdout.write("\n");
		handlePreference(preference, decryptedPassword);
	});
}

function handlePreference (preference, decryptedPassword) {
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
		console.log("Please start over, and this time, type either y or n.");
		return;
	}

	db.storeConfigValue("strongIrcPasswordEncryption", isStrong, (err) => {
		if (err) {
			throw err;
		}
		else {
			// Encrypt the passwords

			console.log("Setting stored. Please ensure that you restart your Pyramid instance before using it again.");

			db.getIrcConfig((err, ircConfig) => {
				if (err) {
					throw err;
				}
				else {
					encryptPasswords(isStrong, ircConfig, decryptedPassword);
				}
			});
		}
	});
}

function encryptPasswords (isStrong, ircConfig, decryptedPassword) {
	let ircConfigTools = require("../server/main/ircConfig")(db);

	let encryptKey = isStrong
		? decryptedPassword
		: currentlyStoredWebPassword;

	ircConfigTools.setEncryptionKey(encryptKey);

	ircConfig.forEach((config) => {
		if (config && config.name && config.password) {
			var decodedData;
			try {
				decodedData = JSON.parse(config.password);
			}
			catch (e) {
				// Invalid format
			}

			var ircPw;

			if (decodedData) {
				// Was already encrypted, let's decrypt first before we re-encrypt
				let decryptKey = wasStrong
					? decryptedPassword
					: currentlyStoredWebPassword;

				ircPw = passwordUtils.decryptSecret(decodedData, decryptKey);
			}
			else {
				ircPw = config.password;
			}

			// Store in db; this command automatically encrypts
			ircConfigTools.modifyServerInIrcConfig(
				config.name,
				{ password: ircPw },
				(err) => {
					if (err) {
						throw err;
					}
					else {
						console.log(
							(decodedData ? "Re-e" : "E") +
							"ncrypted the password for IRC server " +
							config.name
						);
					}
				}
			);
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
			currentlyStoredWebPassword = storedPassword;
			db.getConfigValue("strongIrcPasswordEncryption", (err, status) => {
				if (err) {
					throw err;
				}
				else {
					wasStrong = status || false;
					askForPassword(storedPassword);
				}
			});
		}
	});
});
