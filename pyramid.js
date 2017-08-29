// PYRAMID

// DEBUG TEMP START

const optional = require("optional");
const heapdump = optional("heapdump");

if (heapdump) {
	console.log(
		"Heap dumps enabled! If this process is acting up, " +
		`run:\n\tkill -USR2 ${process.pid}\n` +
		"And then send the resulting heapdump file to the developer.\n" +
		"This helps us improve the app.\n\n" +
		"Thanks for trying out Pyramid!\n"
	);
}

// DEBUG TEMP END

const lib = require("./lib");
lib.init();
