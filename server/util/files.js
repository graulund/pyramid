const fs = require("fs");
const sanitize = require("sanitize-filename");

const copyFile = function(source, target, cb) {
	var cbCalled = false;

	var rd = fs.createReadStream(source);
	rd.on("error", function(err) {
		done(err);
	});
	var wr = fs.createWriteStream(target);
	wr.on("error", function(err) {
		done(err);
	});
	wr.on("close", function() {
		done();
	});
	rd.pipe(wr);

	function done(err) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}
};

const sanitizeFilename = function(str, replacement = "_") {
	return sanitize(str, { replacement });
};

module.exports = {
	copyFile,
	sanitizeFilename
};
