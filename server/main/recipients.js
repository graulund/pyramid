const lodash = require("lodash");

const constants = require("../constants");

module.exports = function(io) {

	var channelRecipients = {};
	var userRecipients = {};
	var categoryRecipients = {
		highlights: [], allfriends: [], system: []
	};

	const addRecipient = function(list, targetName, socket) {
		if (!list[targetName]) {
			list[targetName] = [];
		}
		if (list[targetName].indexOf(socket) < 0) {
			list[targetName].push(socket);
		}
	};

	const removeRecipient = function(list, targetName, socket) {
		if (list[targetName] && list[targetName].indexOf(socket) >= 0){
			lodash.remove(list[targetName], (r) => r === socket);
		}
	};

	const addChannelRecipient = function(channelUri, socket) {
		addRecipient(channelRecipients, channelUri, socket);
	};

	const removeChannelRecipient = function(channelUri, socket) {
		removeRecipient(channelRecipients, channelUri, socket);
	};

	const addUserRecipient = function(username, socket) {
		addRecipient(userRecipients, username, socket);
	};

	const removeUserRecipient = function(username, socket) {
		removeRecipient(userRecipients, username, socket);
	};

	const addCategoryRecipient = function(categoryName, socket) {
		if (constants.SUPPORTED_CATEGORY_NAMES.indexOf(categoryName) >= 0) {
			addRecipient(categoryRecipients, categoryName, socket);
		}
	};

	const removeCategoryRecipient = function(categoryName, socket) {
		if (constants.SUPPORTED_CATEGORY_NAMES.indexOf(categoryName) >= 0) {
			removeRecipient(categoryRecipients, categoryName, socket);
		}
	};

	const removeRecipientEverywhere = function(socket) {
		lodash.forOwn(channelRecipients, (list, channelUri) => {
			removeChannelRecipient(channelUri, socket);
		});
		lodash.forOwn(userRecipients, (list, username) => {
			removeUserRecipient(username, socket);
		});
		lodash.forOwn(categoryRecipients, (list, categoryName) => {
			removeCategoryRecipient(categoryName, socket);
		});
	};

	const emitToUserRecipients = function(username, msg) {
		if (io) {
			io.emitMessageToRecipients(userRecipients[username], msg);
		}
	};

	const emitToCategoryRecipients = function(categoryName, msg) {
		if (io) {
			io.emitMessageToRecipients(categoryRecipients[categoryName], msg);
		}
	};

	const emitCategoryCacheToRecipients = function(categoryName) {
		if (io) {
			io.emitCategoryCacheToRecipients(
				categoryRecipients[categoryName], categoryName
			);
		}
	};

	return {
		addCategoryRecipient,
		addChannelRecipient,
		addRecipient,
		addUserRecipient,
		emitCategoryCacheToRecipients,
		emitToCategoryRecipients,
		emitToUserRecipients,
		getChannelRecipients: (channelUri) => channelRecipients[channelUri],
		getUserRecipients: (username) => userRecipients[username],
		removeCategoryRecipient,
		removeChannelRecipient,
		removeRecipient,
		removeRecipientEverywhere,
		removeUserRecipient
	};
};
