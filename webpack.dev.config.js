const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
	filename: "css/[name].css"
});

const cwd = path.resolve("./");
const node_modules = path.resolve("./node_modules");

var config = {};

// Setup entry points
config.entry = {
	"main": ["babel-polyfill", "./public/src/js/main.js"]
};

// Setup output
config.output = {
	filename: "js/[name].js",
	path: path.resolve("./public/dist"),
	publicPath: "/dist/"
};

// Setup plugins
config.plugins = [];

// Setup rules
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

// Sass
config.module.rules.push({
	test: /\.scss$/,
	use: extractSass.extract({
		use: [
			{ loader: "css-loader" },
			{
				loader: "postcss-loader",
				options: {
					plugins: [
						require("autoprefixer")
					]
				}
			},
			{ loader: "sass-loader" }
		]
	})
});

config.plugins.push(extractSass);

// Set production/development related settings.
config.plugins.push(
	new webpack.DefinePlugin({
		__DEV__: "true",
		"process.env.NODE_ENV": JSON.stringify("development")
	})
);

// fixes for module and loader resolving
config.resolve = {
	modules: [ node_modules, cwd ]
};

module.exports = config;
