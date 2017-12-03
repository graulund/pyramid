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

const memwatch = optional("memwatch-next");

if (memwatch) {
	memwatch.on("leak", function(info) {
		console.warn("Leak detected", info);
	});

	memwatch.on("stats", function(stats) {
		console.log("Memory stats", stats);
	});

	var hd = new memwatch.HeapDiff();

	setInterval(function() {
		var diff = hd.end();
		console.log("Memory diff", diff);

		if (diff && diff.change && diff.change.details) {
			console.log("Details", diff.change.details);
		}

		hd = new memwatch.HeapDiff();
	}, 60000);
}

// DEBUG TEMP END

const lib = require("./lib");
lib.init();
