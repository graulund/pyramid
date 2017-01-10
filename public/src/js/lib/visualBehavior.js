export function areWeScrolledToTheBottom() {
	// Are we scrolled to the bottom?
	// --> Elements that have heights and offsets that matter
	var b = document.body, w = window, c = document.getElementById("container");
	// --> Two oft-used heights
	var ch = c.clientHeight, wh = w.innerHeight;
	// --> The calculation!
	return (ch - (b.scrollTop + wh)) <= 100 || wh >= ch;
}

export function scrollToTheBottom() {
	document.body.scrollTop = document.getElementById("container").clientHeight;
}

export function stickToTheBottom() {
	if (areWeScrolledToTheBottom()) {
		scrollToTheBottom();
	}
}
