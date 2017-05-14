const fs = require("fs");
const path = require("path");

const BUILD_NUMBER_FILE_NAME = path.join(
	__dirname, "..", "public", "src", "js", "buildNumber.js"
);

const ENCODING = { encoding: "utf8" };

const contents = fs.readFileSync(BUILD_NUMBER_FILE_NAME, ENCODING);

if (!contents) {
	throw new Error("No build number file found");
}

const numberMatch = contents.match(/[0-9]+/);

if (!numberMatch || !numberMatch[0]) {
	throw new Error("No build number found");
}

const number = parseInt(numberMatch[0]);

if (number <= 0 || isNaN(number)) {
	throw new Error("Invalid build number found");
}

const newNumber = number + 1;

fs.writeFileSync(
	BUILD_NUMBER_FILE_NAME,
	`export default ${newNumber};\n`,
	ENCODING
);

console.log(`Bumped build number to ${newNumber}`);
