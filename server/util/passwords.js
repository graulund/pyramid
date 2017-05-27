const sodium = require("sodium");

const NOT_SO_SECRET_KEY = "Sup homie, I heard you like keys";
const KEY_LENGTH = 32;

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

function convertTextToCompatibleKey(text) {
	// This is better than just repeating it or cutting it off (I think...)
	let m = new Buffer(text);
	let k = new Buffer(NOT_SO_SECRET_KEY);
	return sodium.api.crypto_generichash(KEY_LENGTH, m, k)
		.toString("base64");
}

function packageSecret(secret) {

	if (!(typeof secret === "object")) {
		return null;
	}

	return {
		c: secret.cipherText.toString("base64"),
		n: secret.nonce.toString("base64")
	};
}

function unpackageSecret(packagedSecret) {

	if (!(typeof packagedSecret === "object")) {
		return null;
	}

	// Expects an object with { cipherText, nonce }

	return {
		cipherText: new Buffer(packagedSecret.c, "base64"),
		nonce: new Buffer(packagedSecret.n, "base64")
	};
}

function encryptSecret(secretMessage, keyString) {
	// Returns object { cipherText, nonce }

	let secretBox = new sodium.SecretBox(
		convertTextToCompatibleKey(keyString), "base64"
	);

	return packageSecret(secretBox.encrypt(secretMessage, "utf8"));
}

function decryptSecret(packagedObj, keyString) {
	let encryptedObj = unpackageSecret(packagedObj);

	let secretBox = new sodium.SecretBox(
		convertTextToCompatibleKey(keyString), "base64"
	);

	return secretBox.decrypt(encryptedObj, "utf8");
}

module.exports = {
	decryptSecret,
	encryptSecret,
	generatePasswordHash,
	verifyPassword
};
