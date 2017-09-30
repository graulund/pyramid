const _ = require("lodash");

const util = require("./util");

const EMOTE_PREFIX_REGEX = "(\\s|^)";
const EMOTE_SUFFIX_REGEX = "(\\s|$)";

const parseSingleEmoticonIndices = function(data) {
	const seqs = data.split(":");

	if (seqs.length > 1) {
		const id = seqs[0], indicesString = seqs[1];
		const indices = indicesString.split(",").map((nums) => {
			const i = nums.split("-");
			return {
				first: parseInt(i[0], 10),
				last: parseInt(i[1], 10)
			};
		});
		return { id, indices };
	}

	return null;
};

const parseEmoticonIndices = function(dataString) {
	const emoteDatas = dataString.split("/");
	return emoteDatas.map(parseSingleEmoticonIndices)
		.filter((em) => em !== null);
};

const generateEmoteRegex = function(code, isInsensitive = false) {
	return new RegExp(
		EMOTE_PREFIX_REGEX +
			"(" + code + ")" +
			EMOTE_SUFFIX_REGEX,
		isInsensitive ? "gi" : "g"
	);
};

const doNewIndicesOverlap = function(indices, emotes) {
	if (emotes && emotes.length) {
		for (var i = 0; i < emotes.length; i++) {
			if (emotes[i] && emotes[i].indices) {
				for (var j = 0; j < emotes[i].indices.length; j++) {
					if (
						util.rangesOverlap(
							indices.first,
							indices.last,
							emotes[i].indices[j].first,
							emotes[i].indices[j].last
						)
					) {
						return true;
					}
				}

			}
		}
	}

	return false;
};

const generateEmoticonIndices = function(message, emoteData, emotes = []) {
	// Expected emotedata: [ { id, code } ...]
	if (message && message.length && emoteData && emoteData.length) {
		const cleanedMessage = util.stringWithoutAstralSymbols(message);
		emoteData.forEach((emote) => {
			if (emote && emote.id && emote.code) {
				const indices = [];
				const rgx = generateEmoteRegex(emote.code, !!emote.insensitive);
				var result;

				while ((result = rgx.exec(cleanedMessage)) !== null) {

					// Calculate indices for this occurrence
					const prefix = result[1], code = result[2], suffix = result[3];
					const firstIndex = result.index + prefix.length;
					const lastIndex = firstIndex + code.length - 1;
					const localIndices = { first: firstIndex, last: lastIndex };

					if (!doNewIndicesOverlap(localIndices, emotes)) {
						indices.push(localIndices);
					}

					// Don't include the space suffix when doing the next search
					rgx.lastIndex -= suffix.length;
				}

				if (indices.length) {
					emotes.push(
						_.assign(
							_.omit(emote, ["code", "insensitive"]),
							{ indices }
						)
					);
				}
			}
		});
	}
	return emotes;
};

const getCheerEmote = function(cheer) {
	let { prefix } = cheer;
	return { id: prefix, code: `${prefix}\\d+`, insensitive: true };
};

const generateCheerIndices = function(message, cheerData, emotes = []) {
	let cheerEmotes = cheerData.map(getCheerEmote);
	let emoteData = generateEmoticonIndices(message, cheerEmotes, emotes.slice(0));
	let cheers = {};

	emoteData.forEach((cheerType) => {
		let { id, indices } = cheerType;
		let cheer = cheerData.find((c) => c.prefix === id);
		if (cheer && cheer.tiers && cheer.tiers.length) {
			indices.forEach(({ first, last }) => {
				let str = message.substring(first, last + 1);
				let amountMatch = str.match(/\d+$/);

				if (!amountMatch || !amountMatch.length) {
					console.warn("Aborted parsing cheermote:", str);
					return;
				}

				let amount = parseInt(amountMatch[0], 10);

				if (amount <= 0) {
					return;
				}

				// Determine tier
				let tier = cheer.tiers[0];

				cheer.tiers.forEach((t) => {
					if (t.min_bits <= amount) {
						tier = t;
					}
				});

				if (tier && tier.images) {
					// Push only the relevant data
					let { color, images } = tier;

					// Group by tiers so we don't send the hard image data more than needed
					let tierName = cheer.prefix + tier.min_bits;

					if (!cheers[tierName]) {
						cheers[tierName] = {
							color, images, indices: []
						};
					}

					cheers[tierName].indices.push({ amount, first, last });
				}
			});
		}
	});

	return Object.values(cheers);
};

module.exports = {
	generateCheerIndices,
	generateEmoticonIndices,
	parseEmoticonIndices
};
