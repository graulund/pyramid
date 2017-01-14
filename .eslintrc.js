module.exports = {
	"env": {
		"browser": true
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
		"indent": 0,
		"no-console": 0,
		"no-tabs": 0,
		"quotes": [2, "double"],
		"semi": [2, "always"],
		"spaced-comment": 0
	}
};
