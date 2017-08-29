import store from "../store";

var electron;
var currentUnseenNumber = 0;

function setUnseenNumber(unseenNumber) {
	let electron = getElectron();

	if (electron) {
		let { ipcRenderer } = electron;

		currentUnseenNumber = unseenNumber;
		ipcRenderer.send("set-badge-count", unseenNumber);
	}
}

export function getElectron() {
	if (!electron && window.require) {
		electron = window.require("electron");
	}

	return electron;
}

export function startUpdatingElectronState() {
	let electron = getElectron();

	if (electron) {
		store.subscribe(function() {
			let state = store.getState();
			let { unseenHighlights } = state;

			// When the unseen number changes

			let unseenNumber = unseenHighlights && unseenHighlights.length || 0;
			if (unseenNumber !== currentUnseenNumber) {
				setUnseenNumber(unseenNumber);
			}
		});
	}
}
