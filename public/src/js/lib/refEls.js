// Tools for reference elements

export function refElSetter (name) {
	// You're meant to bind this returned function to another "this"
	return function (el) {
		this.els = this.els || {};
		this.els[name] = el;
	};
}
