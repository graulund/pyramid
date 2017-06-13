const _ = require("lodash");

const passwordUtils = require("../util/passwords");

module.exports = function(irc, appConfig, ircConfig) {

	var ircPasswords = {};
	var decryptionKey = null;
	var softDecryptionKey = null;

	// Utility

	function isStrongEncryption() {
		return appConfig.configValue("strongIrcPasswordEncryption");
	}

	function getSoftDecryptionKey() {
		return appConfig.configValue("webPassword");
	}

	function decryptIrcPassword(config, key) {
		if (config && config.password) {
			try {
				let passwordData = JSON.parse(config.password);

				return passwordUtils.decryptSecret(
					passwordData, key
				);
			}
			catch (e) {
				// Invalid data
			}
		}

		return null;
	}

	// Main stuff

	function getDecryptedPasswordForServer(serverName) {
		if (ircPasswords[serverName]) {
			return ircPasswords[serverName];
		}

		else {
			let key = isStrongEncryption() ? decryptionKey : softDecryptionKey;

			if (key) {
				let config = ircConfig.currentIrcConfig()
					.find((c) => c.name === serverName);

				let decrypted = decryptIrcPassword(config, key);

				if (decrypted) {
					ircPasswords[serverName] = decrypted;
					return decrypted;
				}
			}
		}

		return null;
	}

	function reencryptIrcPasswords() {
		let config = ircConfig.currentIrcConfig();
		let isStrong = isStrongEncryption();
		let oldKey = isStrong ? decryptionKey : softDecryptionKey;

		config.forEach((c) => {
			if (c && c.name && c.password) {

				var ircPw;

				// Is the decrypted version in our cache?

				if (ircPasswords[c.name]) {
					ircPw = ircPasswords[c.name];
				}

				else {
					let decrypted = decryptIrcPassword(c, oldKey);

					if (!decrypted) {
						return;
					}

					ircPw = decrypted;
				}

				// Store in db; this command automatically encrypts
				ircConfig.modifyServerInIrcConfig(
					c.name,
					{ password: ircPw }
				);
			}
		});
	}

	// Events

	function onStartUp() {
		softDecryptionKey = getSoftDecryptionKey();
		appConfig.addConfigValueChangeHandler("webPassword", function(value, name, rawValue) {
			// Re-encrypt all IRC passwords
			onDecryptionKeyChanged(rawValue);
		});

		if (!isStrongEncryption()) {
			ircConfig.setEncryptionKey(softDecryptionKey);
		}
	}

	function onDecryptionKey(key) {
		if (isStrongEncryption() && decryptionKey !== key) {

			// Store
			decryptionKey = key;
			ircConfig.setEncryptionKey(decryptionKey);

			let added = [];
			let config = ircConfig.currentIrcConfig();

			_.forOwn(config, (c) => {
				if (c && c.name && c.password) {
					let decrypted = decryptIrcPassword(c, decryptionKey);

					if (decrypted) {
						ircPasswords[c.name] = decrypted;
						added.push(c.name);
					}
				}
			});

			// Let IRC know that passwords are now available
			added.forEach((serverName) => {
				irc.clientPasswordAvailable(serverName);
			});
		}
	}

	function onDecryptionKeyChanged(newKey) {
		// Value is changed in the db at this point

		let newSoftKey = getSoftDecryptionKey();

		// Set the new encryption key
		if (isStrongEncryption()) {
			ircConfig.setEncryptionKey(newKey);
		}
		else {
			ircConfig.setEncryptionKey(newSoftKey);
		}

		// Encrypt with that key
		reencryptIrcPasswords();

		// Update internal
		decryptionKey = newKey;
		softDecryptionKey = newSoftKey;
	}

	return {
		getDecryptedPasswordForServer,
		isStrongEncryption,
		onDecryptionKey,
		onDecryptionKeyChanged,
		onStartUp
	};
};
