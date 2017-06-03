const _ = require("lodash");

module.exports = function(io) {

	var channelData = {};

	const clearChannelData = function() {
		channelData = {};
	};

	const getChannelData = function(channel) {
		return channelData[channel];
	};

	const setChannelData = function(channel, data) {
		let current = channelData[channel] || {};
		channelData[channel] = _.assign(current, data);

		if (io) {
			io.emitDataToChannel(channel, data);
		}
	};

	return {
		clearChannelData,
		getChannelData,
		setChannelData
	};
};
