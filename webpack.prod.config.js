var path = require("path");
var webpack = require("webpack");

var config = {};

const cwd = path.resolve("./");
const node_modules = path.resolve("./node_modules");

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
	new webpack.optimize.UglifyJsPlugin({
		compress: {
			warnings: false
		}
	})
);

// Setup loaders
config.module = {
	rules: []
};

// ESLint JS files
config.module.rules.push({
	test: /\.jsx?$/,
	loader: "eslint-loader",
	include: cwd,
	exclude: node_modules,
	enforce: "pre",
	options: {
		//configFile: "./eslintrc.js",
		emitError: true,
		emitWarning: true,
		failOnError: true
	}
});

// Babel (and React)
config.module.rules.push({
	test: /\.jsx?$/,
	loader: "babel-loader",
	include: cwd,
	exclude: node_modules,
	options: {
		cacheDirectory: true,
		presets: [["es2015"/*, { modules: false }*/], "react"],
		plugins: [
			"transform-object-rest-spread"
		]
	}
});

// Set production/development related settings.
config.plugins.push(
	new webpack.DefinePlugin({
		__DEV__: "false",
		"process.env.NODE_ENV": JSON.stringify("production")
	})
);

// fixes for module and loader resolving
config.resolve = {
	modules: [ node_modules, cwd ]
};

module.exports = config;
