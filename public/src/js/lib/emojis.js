import emojiData from "../lib/emojiData";

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
		0xD800 + (code >> 10),
		0xDC00 + (code & 0x3FF)
	);
}

export function convertCodesToEmojis (text) {
	if (emojiData) {
		return text.replace(colonCodeRegex, (code, name) => {
			if (emojiData[name]) {
				return emojiData[name].split("-").map(codepointToEmoji).join("");
			}

			return code;
		});
	}

	return text;
}
