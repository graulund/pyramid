const sodium = require("sodium");

// Password hashing
// Inspired by https://paragonie.com/blog/2016/02/how-safely-store-password-in-2016#nodejs

function generatePasswordHash(password) {
	let hash = sodium.api.crypto_pwhash_str(
		new Buffer(password),
		sodium.api.crypto_pwhash_OPSLIMIT_INTERACTIVE,
		sodium.api.crypto_pwhash_MEMLIMIT_INTERACTIVE
	);

	if (hash) {
		return hash.toString();
	}

	return null;
}

function verifyPassword(enteredPassword, passwordHash) {
	var out;

	try {
		out = sodium.api.crypto_pwhash_str_verify(
			new Buffer(passwordHash),
			new Buffer(enteredPassword)
		);
	}
	catch (e) {
		out = false;
	}

	return out;
}

// Symmetric encryption

function prepareSecretBoxKey(key) {
	if (key.length < 32) {
		throw new Error("Key is not long enough");
	}

	return new Buffer(key.substr(0, 32)).toString("base64");
}

function encryptSecret(secretMessage, key) {
	let secretBox = new sodium.SecretBox(prepareSecretBoxKey(key), "base64");
	return secretBox.encrypt(secretMessage, "utf8");
}

function decryptSecret(cipherText, key) {
	let secretBox = new sodium.SecretBox(prepareSecretBoxKey(key), "base64");
	return secretBox.decrypt(cipherText, "utf8");
}

module.exports = {
	decryptSecret,
	encryptSecret,
	generatePasswordHash,
	verifyPassword
};
