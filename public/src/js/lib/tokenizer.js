import linkifyIt from "linkify-it";
import pick from "lodash/pick";
import values from "lodash/values";

import { emojiData, emojiRegex } from "./emojiData";
import { emojiToCodepoint } from "./emojis";

export const TOKEN_TYPES = {
	TEXT: "text",
	LINK: "link",
	MENTION: "mention",
	EMOJI: "emoji",
	TWITCH_EMOTICON: "twitch_emoticon"
};

const validEmojiCodes = values(emojiData);

// Utility

function textToken(text, offset = 0) {
	return { type: TOKEN_TYPES.TEXT, text, offset };
}

function getTextTokens(tokens, callback) {
	tokens.forEach((token) => {
		if (token.type === TOKEN_TYPES.TEXT) {
			callback(token);
		}
	});
}

function addTokensFromText(tokens, newTokens, preSorted = true) {

	/*
	Expected newTokens format: [
		{
			first: X,
			last: X,
			token: {...}
		},
		...
	]
	*/

	if (!newTokens || !newTokens.length) {
		return tokens;
	}

	if (!preSorted) {
		newTokens.sort((a, b) => {
			if (a && b) {
				if (a.first < b.first) { return -1; }
				if (a.first > b.first) { return 1; }
				return 0;
			}
		});
	}

	var output = [], globalOffset = 0;

	tokens.forEach((token) => {
		if (token.type !== TOKEN_TYPES.TEXT) {
			output.push(token);

			if (token.text && token.text.length) {
				globalOffset += token.text.length;
			}
		}
		else {
			const first = token.offset;
			const last = token.offset + token.text.length - 1;

			const textArray = [...token.text];

			var currentSubOffset = 0;

			newTokens.forEach((newToken) => {
				if (
					newToken.first >= first &&
					newToken.last <= last
				) {
					const subFirst = newToken.first - first;
					const subLast = newToken.last - first;

					const beforeText = textArray.slice(
						currentSubOffset, subFirst
					).join("");

					if (beforeText) {
						output.push(textToken(
							beforeText, globalOffset + currentSubOffset
						));
					}

					output.push({
						...newToken.token,
						text: textArray.slice(subFirst, subLast + 1).join("")
					});

					currentSubOffset = subLast + 1;
				}
			});

			const afterText = textArray.slice(currentSubOffset).join("");
			if (afterText) {
				output.push(textToken(
					afterText, globalOffset + currentSubOffset
				));
			}

			globalOffset += currentSubOffset + afterText.length;
		}
	});

	return output;
}

// Main methods

function tokenizeLinks(tokens) {
	const linkify = new linkifyIt();

	var newTokens = [];

	getTextTokens(tokens, (token) => {
		const { offset, text } = token;

		const matches = linkify.match(text);

		if (matches) {
			newTokens = newTokens.concat(matches.map((match) => {
				const { index, lastIndex, url } = match;

				// Convert offsets to full-char offsets
				const preLength = [...text.substr(0, index)].length;
				const length = [...text.substring(index, lastIndex)].length;

				return {
					first: offset + preLength,
					last: offset + preLength + length - 1,
					token: {
						type: TOKEN_TYPES.LINK,
						url
					}
				};
			}));
		}
	});

	return addTokensFromText(tokens, newTokens);
}

function tokenizeEmoji(tokens) {
	var newTokens = [];

	// TODO: Some day emoji tokenization should happen inside
	// all nodes with text values, not just those of type "text"

	// (think emoji inside a link text)

	getTextTokens(tokens, (token) => {
		const { offset, text } = token;
		const segments = text.split(emojiRegex);

		var prevText = "";

		segments.forEach((segment) => {
			const codepoints = emojiToCodepoint(segment);
			const isEmoji = validEmojiCodes.indexOf(codepoints) >= 0;

			if (isEmoji) {
				const first = offset + [...prevText].length;
				const last = first + [...segment].length - 1;
				const token = {
					first,
					last,
					token: {
						type: TOKEN_TYPES.EMOJI,
						codepoints
					}
				};

				newTokens.push(token);
			}

			prevText += segment;
		});
	});

	return addTokensFromText(tokens, newTokens);
}

function tokenizeMentions(tokens, highlights) {
	var newTokens = [];

	if (highlights && highlights.length) {
		getTextTokens(tokens, (token) => {

			const { offset, text } = token;

			highlights.forEach((highlight) => {

				// TODO: Non-alphanumeric nicknames

				const rgx = new RegExp("\\b" + highlight + "\\b", "gi");
				var result;

				while ((result = rgx.exec(text)) !== null) {

					const { index } = result;
					const lastIndex = index + result[0].length;

					// Convert offsets to full-char offsets
					const preLength = [...text.substr(0, index)].length;
					const length = [...text.substring(index, lastIndex)].length;

					const token = {
						first: offset + preLength,
						last: offset + preLength + length - 1,
						token: { type: TOKEN_TYPES.MENTION }
					};

					newTokens.push(token);
				}
			});
		});
	}

	return addTokensFromText(tokens, newTokens);
}

function tokenizeTwitch(tokens, tags) {
	if (tags && tags.emotes && tags.emotes.length) {
		var emoteTokens = [];

		getTextTokens(tokens, (token) => {
			emoteTokens = emoteTokens.concat(
				getTwitchEmoteTokens(tags.emotes, token.offset)
			);
		});

		return addTokensFromText(tokens, emoteTokens, false);
	}

	return tokens;
}

function getTwitchEmoteTokens(emotes, offset = 0) {
	const emoteTokens = [];
	emotes.forEach((e) => {
		if (e && e.indices) {
			e.indices.forEach((i) => {
				if (i) {
					const first = parseInt(i.first, 10) - offset;
					const last = parseInt(i.last, 10) - offset;

					if (!isNaN(first) && !isNaN(last)) {
						const emoteProperties = pick(
							e, ["id", "imageType", "sizes", "type"]
						);
						emoteTokens.push({
							first,
							last,
							token: {
								type: TOKEN_TYPES.TWITCH_EMOTICON,
								emote: emoteProperties
							}
						});
					}
				}
			});
		}
	});

	return emoteTokens;
}

export function tokenizeChatLine(line, isTwitch = false) {
	var tokens = [
		textToken(line.message)
	];

	if (isTwitch) {
		// Message objects come prefabricated with offsets,
		// so we must handle this first.
		tokens = tokenizeTwitch(tokens, line.tags);
	}

	tokens = tokenizeLinks(tokens);
	tokens = tokenizeEmoji(tokens);
	tokens = tokenizeMentions(tokens, line.highlight);

	return tokens;
}
