import emojiData from "./emojiData";

const colonCodeRegex = /:([^:\s]+):/g;

// This code borrowed by FFZ, which says:
// This code borrowed from the twemoji project, with tweaks.

function codepointToEmoji(codepoint) {
	var code = typeof codepoint === "string" ? parseInt(codepoint, 16) : codepoint;

	if (code < 0x10000) {
		return String.fromCharCode(code);
	}

	code -= 0x10000;
	return String.fromCharCode(
		0xd800 + (code >> 10),
		0xdc00 + (code & 0x3ff)
	);
}

const ufe0fg = /\ufe0f/g;
const u200d = String.fromCharCode(0x200d);

const cachedEmojiCodepoints = {};

export function emojiToCodepoint(surrogates) {
	if (cachedEmojiCodepoints[surrogates]) {
		return cachedEmojiCodepoints[surrogates];
	}

	const input = surrogates.indexOf(u200d) === -1
		? surrogates.replace(ufe0fg, "")
		: surrogates;
	var out = [], c = 0, p = 0, i = 0;

	while (i < input.length) {
		c = input.charCodeAt(i++);
		if (p) {
			out.push(
				(0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00))
				.toString(16)
			);
			p = 0;
		} else if (0xd800 <= c && c <= 0xdbff) {
			p = c;
		}
		else {
			out.push(c.toString(16));
		}
	}

	const retval = cachedEmojiCodepoints[surrogates] = out.join("-");
	return retval;
}

export function convertCodesToEmojis (text, extraInfo = false) {
	var matchIndex = -1, replacementLength = 0;
	if (emojiData) {
		text = text.replace(colonCodeRegex, (code, name) => {
			if (emojiData[name]) {
				let emoji = emojiData[name].split("-").map(codepointToEmoji).join("");

				matchIndex = text.indexOf(code);
				replacementLength = emoji.length;

				return emoji;
			}

			return code;
		});
	}

	if (extraInfo) {
		return {
			matchIndex,
			replacementLength,
			result: text
		};
	}

	return text;
}
