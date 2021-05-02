const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
	devtool: "source-map",

	entry: {
		main: ["babel-polyfill", "./public/src/js/main.js"]
	},

	output: {
		filename: "js/[name].js",
		path: path.resolve(__dirname, "public/dist"),
		publicPath: "/dist/"
	},

	plugins: [
		new webpack.ProgressPlugin(),
		new MiniCssExtractPlugin({ filename: "css/main.css" })
	],

	module: {
		rules: [
			{
				test: /\.(png|jpe?g|gif)$/,
				type: "asset/resource"
			},
			{
				test: /\.(js|jsx)$/,
				include: [path.resolve(__dirname, "public", "src")],
				loader: "babel-loader"
			},
			{
				test: /\.(js|jsx)$/,
				include: [path.resolve(__dirname, "public", "src")],
				loader: "eslint-loader"
			},
			{
				test: /.(sa|sc|c)ss$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader
					},
					{
						loader: "css-loader",

						options: {
							sourceMap: true
						}
					},
					{
						loader: "postcss-loader",
						options: {
							postcssOptions: {
								plugins: [
									require("autoprefixer")
								]
							}
						}
					},
					{
						loader: "sass-loader",

						options: {
							sourceMap: true
						}
					}
				]
			}
		]
	}
};
