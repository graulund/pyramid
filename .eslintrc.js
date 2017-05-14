module.exports = {
	"env": {
		"browser": true,
		"es6": true
	},
	"extends": ["eslint:recommended", "plugin:react/recommended"],
	"parser": "babel-eslint",
	"parserOptions": {
		"ecmaFeatures": {
			"jsx": true
		}
	},
	"plugins": [
		"standard",
		"promise",
		"react"
	],
	"rules": {
		"eqeqeq": [2, "smart"],
		"indent": 0,
		"no-constant-condition": 0,
		"no-console": 0,
		"no-tabs": 0,
		"quotes": [2, "double"],
		"react/jsx-no-bind": 2,
		"semi": [2, "always"],
		"spaced-comment": 0
	}
};
