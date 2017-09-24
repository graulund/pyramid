const _ = require("lodash");
const async = require("async");

const { CHANNEL_TYPES } = require("../constants");
const channelUtils = require("../util/channels");
const passwordUtils = require("../util/passwords");
const stringUtils = require("../util/strings");

module.exports = function(db, io, restriction) {

	var currentIrcConfig = [];

	var channelIdCache = {};
	var serverIdCache = {};

	var encryptionKey = null;

	const getIrcConfig = function(callback) {
		db.getIrcConfig(callback);
	};

	const loadIrcConfig = function(callback) {
		getIrcConfig((err, data) => {
			if (err) {
				if (typeof callback === "function") {
					callback(err);
				}
			}
			else {
				currentIrcConfig = data;
				generateIrcConfigCaches();
				if (typeof callback === "function") {
					callback(null, data);
				}
			}
		});
	};

	const loadAndEmitIrcConfig = function(callback) {
		// Will call above
		io.emitIrcConfig(null, callback);
	};

	const generateIrcConfigCaches = function(config = currentIrcConfig) {
		var serverIds = {}, channelIds = {};

		if (config && config.length) {
			config.forEach((server) => {
				if (server && server.serverId && server.name) {
					serverIds[server.name] = server.serverId;

					if (server.channels && server.channels.length) {
						server.channels.forEach((channel) => {
							if (channel && channel.channelId && channel.name) {
								var channelUri;

								if (channel.channelType === CHANNEL_TYPES.PRIVATE) {
									if (channel.name.indexOf(",") >= 0) {
										// Old format; abort
										return;
									}

									channelUri = channelUtils.getPrivateConversationUri(
										server.name, channel.name
									);
								}

								else {
									channelUri = channelUtils.getChannelUri(
										server.name, channel.name
									);
								}

								channelIds[channelUri] = channel.channelId;
							}
						});
					}
				}
			});

			serverIdCache = _.assign(serverIdCache, serverIds);
			channelIdCache = _.assign(channelIdCache, channelIds);
		}
	};

	const safeIrcConfigDict = function(ircConfig = currentIrcConfig) {
		var ircConfigDict = {};
		ircConfig.forEach((config) => {
			var outConfig = _.omit(config, ["password", "serverId"]);

			if (config.password) {
				// Signal that a password has been set
				outConfig.password = true;
			}

			let channels = outConfig.channels;
			if (channels) {
				outConfig.channels = {};
				channels.forEach((channel) => {
					let { channelConfig, channelType, displayName, name } = channel;
					if (channelType === CHANNEL_TYPES.PUBLIC) {
						let out;

						if (channelConfig) {
							out = { channelConfig, displayName, name };
						}
						else {
							out = { displayName, name };
						}

						outConfig.channels[name] = out;
					}
				});
			}

			ircConfigDict[config.name] = outConfig;
		});

		return ircConfigDict;
	};

	const getIrcConfigByName = function(name, ircConfig = currentIrcConfig) {
		for (var i = 0; i < ircConfig.length; i++) {
			if (ircConfig[i].name === name) {
				return ircConfig[i];
			}
		}

		return null;
	};

	const getIrcConfigChannelByName = function(serverName, name, ircConfig = currentIrcConfig) {
		let s = getIrcConfigByName(serverName, ircConfig);
		if (s) {
			let channels = s.channels.filter((channel) => channel.name === name);

			if (channels) {
				return channels[0] || null;
			}
		}

		return null;
	};

	const getConfigPublicChannelsInServer = function(serverName, ircConfig = currentIrcConfig) {
		const s = getIrcConfigByName(serverName, ircConfig);
		if (s) {
			return s.channels.filter(
				(channel) => channel.channelType === CHANNEL_TYPES.PUBLIC
			).map(
				(channel) => channelUtils.getChannelUri(serverName, channel.name)
			);
		}

		return [];
	};

	const channelConfigValue = function(channelUri, name) {
		let uriData = channelUtils.parseChannelUri(channelUri);

		if (!uriData) {
			// Invalid URI
			return undefined;
		}

		let { channel, channelType, server } = uriData;

		if (channelType === CHANNEL_TYPES.PUBLIC) {
			let c = getIrcConfigChannelByName(server, channel);

			if (c && c.channelConfig) {
				return c.channelConfig[name];
			}
		}

		return undefined;
	};

	// Storing

	const addServerToIrcConfig = function(data, callback) {

		if (data && data.name && data.name.charAt(0) === "_") {
			// Not allowed to start a server name with "_"
			callback(new Error("Not allowed to start a server name with an underscore"));
			return;
		}

		isServersLimitReached(function(reached) {
			if (reached) {
				callback(new Error("Server limit reached"));
			}

			else {
				if (data.password && encryptionKey) {
					data.password = JSON.stringify(
						passwordUtils.encryptSecret(
							data.password, encryptionKey
						)
					);
				}

				db.addServerToIrcConfig(data, callback);
			}
		});
	};

	const modifyServerInIrcConfig = function(serverName, details, callback) {

		if (details.password && encryptionKey) {
			details.password = JSON.stringify(
				passwordUtils.encryptSecret(
					details.password, encryptionKey
				)
			);
		}

		async.waterfall([
			(callback) => db.getServerId(serverName, callback),
			(data, callback) => {
				if (data) {
					db.modifyServerInIrcConfig(data.serverId, details, callback);
				}
				else {
					callback(new Error("No such server"));
				}
			}
		], callback);
	};

	const removeServerFromIrcConfig = function(serverName, callback) {
		async.waterfall([
			(callback) => db.getServerId(serverName, callback),
			(data, callback) => {
				if (data) {
					db.removeServerFromIrcConfig(data.serverId, callback);
				}
				else {
					callback(new Error("No such server"));
				}
			}
		], callback);
	};

	const addChannelToIrcConfig = function(serverName, name, channelType, data, callback) {
		isChannelsLimitReached(function(reached) {
			if (reached) {
				callback(new Error("Channel limit reached"));
			}

			else {
				name = name.replace(/^#/, "");
				async.waterfall([
					(callback) => db.getServerId(serverName, callback),
					(serverData, callback) => {
						if (serverData) {
							db.addChannelToIrcConfig(
								serverData.serverId, name, channelType, data, callback
							);
						}
						else {
							callback(new Error("No such server"));
						}
					}
				], callback);
			}
		});
	};

	const addChannelToIrcConfigFromUri = function(channelUri, callback) {
		let uriData = channelUtils.parseChannelUri(channelUri);

		if (!uriData) {
			callback(new Error("Invalid channel URI"));
			return;
		}

		let { channel, channelType, server } = uriData;

		addChannelToIrcConfig(server, channel, channelType, {}, callback);
	};

	const modifyChannelInIrcConfig = function(serverName, name, details, callback) {
		name = name.replace(/^#/, "");

		// Add any new configuration to the old one
		if (details.channelConfig) {
			let current = getIrcConfigChannelByName(serverName, name);

			if (current && current.channelConfig) {
				details.channelConfig = _.assign(
					{}, current.channelConfig, details.channelConfig
				);
			}
		}

		async.waterfall([
			(callback) => db.getChannelId(
				serverName, name, CHANNEL_TYPES.PUBLIC, callback
			),
			(data, callback) => {
				if (data) {
					db.modifyChannelInIrcConfig(data.channelId, details, callback);
				}
				else {
					callback(new Error("No such channel"));
				}
			}
		], callback);
	};

	const removeChannelFromIrcConfig = function(serverName, name, callback) {
		name = name.replace(/^#/, "");
		async.waterfall([
			(callback) => db.getChannelId(
				serverName, name, CHANNEL_TYPES.PUBLIC, callback
			),
			(data, callback) => {
				if (data) {
					db.removeChannelFromIrcConfig(data.channelId, callback);
				}
				else {
					callback(new Error("No such channel"));
				}
			}
		], callback);
	};

	// Composite store functions

	const addIrcServerFromDetails = function(details, callback) {
		if (details && details.name && details.data) {
			const name = stringUtils.formatUriName(details.name);
			const data = _.assign({}, details.data, { name });

			if (name) {
				addServerToIrcConfig(
					data,
					(err) => {
						if (err) {
							callback(err);
						}
						else {
							// Add all channels
							if (data.channels) {
								const channelNames = [];
								const channelList = Array.isArray(data.channels)
									? data.channels
									: Object.keys(data.channels);

								channelList.forEach((channel) => {
									const channelName = channel.name || channel;

									if (typeof channelName === "string" && channelName) {
										let cn = stringUtils.formatUriName(channelName);

										if (cn) {
											channelNames.push(cn);
										}
									}
								});

								if (channelNames.length) {
									async.parallel(
										channelNames.map((channelName) =>
											((callback) => addChannelToIrcConfig(
												name,
												channelName,
												CHANNEL_TYPES.PUBLIC,
												{},
												callback
											))
										),
										callback
									);
								}
								else {
									callback();
								}
							}
							else {
								callback();
							}
						}
					}
				);
				return;
			}
		}

		callback(new Error("Insufficient data"));
	};

	// Restrictions

	const isChannelsLimitReached = function(callback) {
		if (!restriction) {
			callback(false);
		}

		else {
			db.getIrcChannelCount(function(err, data) {
				let reached = data && data.count >= restriction.channelsLimit;
				callback(reached);
			});
		}
	};

	const isServersLimitReached = function(callback) {
		if (!restriction) {
			callback(false);
		}

		else {
			db.getIrcServerCount(function(err, data) {
				let reached = data && data.count >= restriction.serversLimit;
				callback(reached);
			});
		}
	};

	// API

	return {
		addChannelToIrcConfig,
		addChannelToIrcConfigFromUri,
		addIrcServerFromDetails,
		addServerToIrcConfig,
		channelConfigValue,
		channelIdCache: () => channelIdCache,
		currentIrcConfig: () => currentIrcConfig,
		getConfigPublicChannelsInServer,
		getIrcConfig,
		getIrcConfigByName,
		loadIrcConfig,
		loadAndEmitIrcConfig,
		modifyChannelInIrcConfig,
		modifyServerInIrcConfig,
		removeChannelFromIrcConfig,
		removeServerFromIrcConfig,
		safeIrcConfigDict,
		serverIdCache: () => serverIdCache,
		setEncryptionKey: (k) => { encryptionKey = k; }
	};
};
