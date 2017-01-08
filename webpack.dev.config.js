var path = require("path");
var webpack = require("webpack");

var config = {};

// Setup entry points
config.entry = {
	"main": ["whatwg-fetch", "babel-polyfill", "./public/src/js/main.js"]
};

// Setup output
config.output = {
	filename: "js/[name].js",
	path: "./public/dist/",
	publicPath: "/"
};

// Setup plugins
config.plugins = [];

config.plugins.push(
	new webpack.optimize.OccurenceOrderPlugin(true) // ensures predictable module ids in compiled bundle + slightly smaller file size
);

// Setup loaders
config.module = {
	preLoaders: [],
	loaders: [],
	postLoaders: []
};

// Babel (and React)
config.module.loaders.push({
	test: /\.jsx?$/,
	loader: "babel-loader",
	include: path.resolve("./"), // necessary to avoid including symlinks pointing out of ./node_modules/
	exclude: path.resolve("./node_modules")
});

config.babel = {
	presets: [
		require.resolve("babel-preset-es2015")
	],
	plugins: [
		require.resolve("babel-plugin-transform-exponentiation-operator"),
		require.resolve("babel-plugin-transform-object-rest-spread")
	],
	cacheDirectory: true
};
config.babel.presets.push(
	require.resolve("babel-preset-react")
);


// Set production/development related settings.
config.plugins.push(
	new webpack.DefinePlugin({
		__DEV__: "true",
		"process.env.NODE_ENV": JSON.stringify("development")
	})
);

// fixes for module and loader resolving
config.resolveLoader = {
	root: path.join(__dirname, "node_modules") // makes npm link'ed modules work with loaders
};
config.resolve = {
	root: [
		path.resolve(__dirname, "node_modules"), // makes npm link'ed modules work with local node_modules
		path.resolve(".") // allow e.g. LESS @imports to reference local files with ~
	]
};

module.exports = config;
