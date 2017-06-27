const { CHANNEL_TYPES } = require("../constants");

module.exports = function(irc, ircConfig, io) {
	const addAndJoinChannel = function(serverName, name, data, callback) {
		ircConfig.addChannelToIrcConfig(
			serverName, name, CHANNEL_TYPES.PUBLIC, data,
			(err) => {
				joinIrcChannel(serverName, name);
				if (io) {
					io.emitIrcConfig();
				}
				if (typeof callback === "function") {
					callback(err);
				}
			}
		);
	};

	const connectUnconnectedIrcs = function() {
		irc.connectUnconnectedClients();
	};

	const loadAndConnectUnconnectedIrcs = function(callback) {
		ircConfig.loadAndEmitIrcConfig(() => {
			connectUnconnectedIrcs();

			if (typeof callback === "function") {
				callback();
			}
		});
	};

	const reconnectIrcServer = function(serverName) {
		irc.reconnectServer(serverName);
	};

	const disconnectIrcServer = function(serverName) {
		irc.disconnectServer(serverName);
	};

	const disconnectAndRemoveIrcServer = function(serverName) {
		irc.removeServer(serverName);
	};

	const joinIrcChannel = function(serverName, channelName) {
		irc.joinChannel(serverName, channelName);
	};

	const partIrcChannel = function(serverName, channelName) {
		irc.partChannel(serverName, channelName);
	};

	const sendOutgoingMessage = function(channel, message, messageToken) {
		irc.sendOutgoingMessage(channel, message, messageToken);
	};

	const currentIrcClients = function() {
		return irc.clients();
	};

	const getIrcChannelNameFromUri = function(channelUri) {
		return irc.getIrcChannelNameFromUri(channelUri);
	};

	return {
		addAndJoinChannel,
		connectUnconnectedIrcs,
		currentIrcClients,
		disconnectAndRemoveIrcServer,
		disconnectIrcServer,
		getIrcChannelNameFromUri,
		joinIrcChannel,
		loadAndConnectUnconnectedIrcs,
		partIrcChannel,
		reconnectIrcServer,
		sendOutgoingMessage
	};
};
