// Big thanks to FrankerFaceZ

import { COLOR_BLINDNESS, BG_COLOR, DARKMODE_BG_COLOR } from "../constants";

// Settings

const luv_contrast = 4.5;

const CVDMatrix = {
	[COLOR_BLINDNESS.PROTANOPE]: [
		// reds are greatly reduced (1% men)
		0.0, 2.02344, -2.52581,
		0.0, 1.0,      0.0,
		0.0, 0.0,      1.0
	],
	[COLOR_BLINDNESS.DEUTERANOPE]: [
		// greens are greatly reduced (1% men)
		1.0,      0.0, 0.0,
		0.494207, 0.0, 1.24827,
		0.0,      0.0, 1.0
	],
	[COLOR_BLINDNESS.TRITANOPE]: [
		// blues are greatly reduced (0.003% population)
		1.0,       0.0,      0.0,
		0.0,       1.0,      0.0,
		-0.395913, 0.801109, 0.0
	]
};

// State

var _hslluma_required_bright = null;
var _hslluma_required_dark = null;
var cachedHexColors = {};
var _context = null;

// Utility

function hue2rgb(p, q, t) {
	if (t < 0) {
		t += 1;
	}

	if (t > 1) {
		t -= 1;
	}

	if (t < 1/6) {
		return p + (q-p) * 6 * t;
	}

	if (t < 1/2) {
		return q;
	}

	if (t < 2/3) {
		return p + (q-p) * (2/3 - t) * 6;
	}

	return p;
}

function bit2linear(channel) {
	// http://www.brucelindbloom.com/Eqn_RGB_to_XYZ.html
	// This converts rgb 8bit to rgb linear, lazy because the other algorithm is really really dumb
	//return Math.pow(channel, 2.2);

	// CSS Colors Level 4 says 0.03928, Bruce Lindbloom who cared to write all algos says 0.04045, used bruce because whynawt
	return (channel <= 0.04045)
		? channel / 12.92
		: Math.pow((channel + 0.055) / 1.055, 2.4);
}

function linear2bit(channel) {
	// Using lazy conversion in the other direction as well
	//return Math.pow(channel, 1/2.2);

	// I'm honestly not sure about 0.0031308, I've only seen it referenced on Bruce Lindbloom's site
	return (channel <= 0.0031308)
		? channel * 12.92
		: Math.pow(1.055 * channel, 1/2.4) - 0.055;
}

// Color handling classes

export class RGBAColor {
	constructor(r, g, b, a) {
		this.r = r || 0;
		this.g = g || 0;
		this.b = b || 0;
		this.a = a || 0;
	}

	eq(rgb) {
		return rgb.r === this.r &&
			rgb.g === this.g &&
			rgb.b === this.b &&
			rgb.a === this.a;
	}

	toHSLA() {
		return HSLAColor.fromRGBA(this.r, this.g, this.b, this.a);
	}

	toCSS() {
		return "rgb" + (this.a !== 1 ? "a" : "") +
			"(" +
				Math.round(this.r) + "," +
				Math.round(this.g) + "," +
				Math.round(this.b) +
				(this.a !== 1 ? "," + this.a : "") +
			")";
	}

	toHex() {
		var rgb = this.b | (this.g << 8) | (this.r << 16);
		return "#" + (0x1000000 + rgb).toString(16).slice(1);
	}

	get_Y() {
		return ((0.299 * this.r) + ( 0.587 * this.g) + ( 0.114 * this.b)) / 255;
	}

	luminance() {
		var r = bit2linear(this.r / 255),
			g = bit2linear(this.g / 255),
			b = bit2linear(this.b / 255);

		return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
	}

	brighten(amount) {
		amount = typeof amount === "number" ? amount : 1;
		amount = Math.round(255 * (amount / 100));

		return new RGBAColor(
			Math.max(0, Math.min(255, this.r + amount)),
			Math.max(0, Math.min(255, this.g + amount)),
			Math.max(0, Math.min(255, this.b + amount)),
			this.a
		);
	}

	daltonize(type) {
		var cvd;

		if (typeof type === "number" || typeof type === "string") {
			if (CVDMatrix.hasOwnProperty(type)) {
				cvd = CVDMatrix[type];
			}
			else {
				throw "Invalid CVD matrix.";
			}
		} else {
			cvd = type;
		}

		var cvd_a = cvd[0], cvd_b = cvd[1], cvd_c = cvd[2],
			cvd_d = cvd[3], cvd_e = cvd[4], cvd_f = cvd[5],
			cvd_g = cvd[6], cvd_h = cvd[7], cvd_i = cvd[8],
			L, M, S, l, m, s, R, G, B, RR, GG, BB;

		// RGB to LMS matrix conversion
		L = (17.8824 * this.r) + (43.5161 * this.g) + (4.11935 * this.b);
		M = (3.45565 * this.r) + (27.1554 * this.g) + (3.86714 * this.b);
		S = (0.0299566 * this.r) + (0.184309 * this.g) + (1.46709 * this.b);

		// Simulate color blindness
		l = (cvd_a * L) + (cvd_b * M) + (cvd_c * S);
		m = (cvd_d * L) + (cvd_e * M) + (cvd_f * S);
		s = (cvd_g * L) + (cvd_h * M) + (cvd_i * S);

		// LMS to RGB matrix conversion
		R = (0.0809444479 * l) + (-0.130504409 * m) + (0.116721066 * s);
		G = (-0.0102485335 * l) + (0.0540193266 * m) + (-0.113614708 * s);
		B = (-0.000365296938 * l) + (-0.00412161469 * m) + (0.693511405 * s);

		// Isolate invisible colors to color vision deficiency (calculate error matrix)
		R = this.r - R;
		G = this.g - G;
		B = this.b - B;

		// Shift colors towards visible spectrum (apply error modifications)
		RR = (0.0 * R) + (0.0 * G) + (0.0 * B);
		GG = (0.7 * R) + (1.0 * G) + (0.0 * B);
		BB = (0.7 * R) + (0.0 * G) + (1.0 * B);

		// Add compensation to original values
		R = Math.min(Math.max(0, RR + this.r), 255);
		G = Math.min(Math.max(0, GG + this.g), 255);
		B = Math.min(Math.max(0, BB + this.b), 255);

		return new RGBAColor(R, G, B, this.a);
	}

	_r(r) { return new RGBAColor(r, this.g, this.b, this.a); }
	_g(g) { return new RGBAColor(this.r, g, this.b, this.a); }
	_b(b) { return new RGBAColor(this.r, this.g, b, this.a); }
	_a(a) { return new RGBAColor(this.r, this.g, this.b, a); }

	static fromName(name) {
		var context = _context;
		if (!context) {
			var canvas = document.createElement("canvas");
			context = _context = canvas.getContext("2d");
		}

		context.clearRect(0, 0, 1, 1);
		context.fillStyle = name;
		context.fillRect(0, 0, 1, 1);
		var data = context.getImageData(0, 0, 1, 1);

		if (!data || !data.data || data.data.length !== 4) {
			return null;
		}

		return new RGBAColor(
			data.data[0],
			data.data[1],
			data.data[2],
			data.data[3] / 255
		);
	}

	static fromCSS(rgb) {
		if (!rgb) {
			return null;
		}

		rgb = rgb.trim();

		if (rgb.charAt(0) === "#") {
			return RGBAColor.fromHex(rgb);
		}

		var match = /rgba?\( *(\d+%?) *, *(\d+%?) *, *(\d+%?) *(?:, *([\d\.]+))?\)/
			.exec(rgb);

		if (match) {
			var r = match[1],
				g = match[2],
				b = match[3],
				a = match[4];

			if (r.charAt(r.length-1) === "%") {
				r = 255 * (parseInt(r) / 100);
			}
			else {
				r = parseInt(r);
			}

			if (g.charAt(g.length-1) === "%") {
				g = 255 * (parseInt(g) / 100);
			}
			else {
				g = parseInt(g);
			}

			if (b.charAt(b.length-1) === "%") {
				b = 255 * (parseInt(b) / 100);
			}
			else {
				b = parseInt(b);
			}

			if (a) {
				if (a.charAt(a.length-1) === "%") {
					a = parseInt(a) / 100;
				}
				else {
					a = parseFloat(a);
				}
			}
			else {
				a = 1;
			}

			return new RGBAColor(
				Math.min(Math.max(0, r), 255),
				Math.min(Math.max(0, g), 255),
				Math.min(Math.max(0, b), 255),
				Math.min(Math.max(0, a), 1)
			);
		}

		return RGBAColor.fromName(rgb);
	}

	static fromHex(code) {
		var hex = code.charAt(0) === "#" ? code.substr(1) : code;

		if (hex.length === 3) {
			// Shorthand notation
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}

		var raw = parseInt(hex, 16);

		return new RGBAColor(
			(raw >> 16),         // Red
			(raw >> 8 & 0x00FF), // Green
			(raw & 0x0000FF),    // Blue,
			1                    // Alpha
		);
	}

	static fromHSVA(h, s, v, a) {
		var r, g, b,

			i = Math.floor(h * 6),
			f = h * 6 - i,
			p = v * (1 - s),
			q = v * (1 - f * s),
			t = v * (1 - (1 - f) * s);

		switch(i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q;
		}

		return new RGBAColor(
			Math.round(Math.min(Math.max(0, r*255), 255)),
			Math.round(Math.min(Math.max(0, g*255), 255)),
			Math.round(Math.min(Math.max(0, b*255), 255)),
			a === undefined ? 1 : a
		);
	}

	static fromXYZA(x, y, z, a) {
		var R =  3.240479 * x - 1.537150 * y - 0.498535 * z,
			G = -0.969256 * x + 1.875992 * y + 0.041556 * z,
			B =  0.055648 * x - 0.204043 * y + 1.057311 * z;

		// Make sure we end up in a real color space
		return new RGBAColor(
			Math.max(0, Math.min(255, 255 * linear2bit(R))),
			Math.max(0, Math.min(255, 255 * linear2bit(G))),
			Math.max(0, Math.min(255, 255 * linear2bit(B))),
			a === undefined ? 1 : a
		);
	}

	static fromHSLA(h, s, l, a) {
		if (s === 0) {
			var v = Math.round(Math.min(Math.max(0, 255*l), 255));
			return new RGBAColor(v, v, v, a === undefined ? 1 : a);
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s,
			p = 2 * l - q;

		return new RGBAColor(
			Math.round(Math.min(Math.max(0, 255 * hue2rgb(p, q, h + 1/3)), 255)),
			Math.round(Math.min(Math.max(0, 255 * hue2rgb(p, q, h)), 255)),
			Math.round(Math.min(Math.max(0, 255 * hue2rgb(p, q, h - 1/3)), 255)),
			a === undefined ? 1 : a
		);
	}
}

export class HSLAColor {
	constructor(h, s, l, a) {
		this.h = h || 0;
		this.s = s || 0;
		this.l = l || 0;
		this.a = a || 0;
	}

	eq(hsl) {
		return hsl.h === this.h &&
			hsl.s === this.s &&
			hsl.l === this.l &&
			hsl.a === this.a;
	}

	targetLuminance(target) {
		var s = this.s;
		s *= Math.pow(this.l > 0.5 ? -this.l : this.l - 1, 7) + 1;

		var min = 0, max = 1, d = (max - min) / 2, mid = min + d;
		for (; d > 1/65536; d /= 2, mid = min + d) {
			var luminance = RGBAColor.fromHSLA(this.h, s, mid, 1).luminance();

			if (luminance > target) {
				max = mid;
			} else {
				min = mid;
			}
		}

		return new HSLAColor(this.h, s, mid, this.a);
	}

	toRGBA() {
		return RGBAColor.fromHSLA(this.h, this.s, this.l, this.a);
	}

	toCSS() {
		return "hsl" + (this.a !== 1 ? "a" : "") +
			"(" +
				Math.round(this.h*360) + "," +
				Math.round(this.s*100) + "%," +
				Math.round(this.l*100) + "%" +
				(this.a !== 1 ? "," + this.a : "") +
			")";
	}

	_h(h) { return new HSLAColor(h, this.s, this.l, this.a); }
	_s(s) { return new HSLAColor(this.h, s, this.l, this.a); }
	_l(l) { return new HSLAColor(this.h, this.s, l, this.a); }
	_a(a) { return new HSLAColor(this.h, this.s, this.l, a); }

	static fromRGBA(r, g, b, a) {
		r /= 255; g /= 255; b /= 255;

		var max = Math.max(r,g,b),
			min = Math.min(r,g,b),

			h, s, l = Math.min(Math.max(0, (max+min) / 2), 1),
			d = Math.min(Math.max(0, max - min), 1);

		if (d === 0) {
			h = s = 0;
		}
		else {
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
			}
			h /= 6;
		}

		return new HSLAColor(h, s, l, a === undefined ? 1 : a);
	}
}

// Set up code

function rebuildContrast() {
	_hslluma_required_bright = luv_contrast *
		(RGBAColor.fromCSS(DARKMODE_BG_COLOR).luminance() + 0.05) - 0.05;

	_hslluma_required_dark =
		(RGBAColor.fromCSS(BG_COLOR).luminance() + 0.05) /
		luv_contrast - 0.05;
}

export function fixColorContrast(color, colorBlindness = 0) {
	if (color instanceof RGBAColor) {
		color = color.toCSS();
	}

	if (!color) {
		return null;
	}

	if (cachedHexColors.hasOwnProperty(color)) {
		return cachedHexColors[color];
	}

	if (!_hslluma_required_bright) {
		rebuildContrast();
	}

	var rgb = RGBAColor.fromCSS(color),
		light_color = rgb,
		dark_color = rgb;

	// Color Blindness Handling
	if (colorBlindness) {
		var new_color = rgb.daltonize(colorBlindness);
		if (!rgb.eq(new_color)) {
			rgb = new_color;
			light_color = dark_color = rgb;
		}
	}

	// Color Processing - HSL Luma
	var lum = rgb.luminance();

	if (lum > _hslluma_required_dark) {
		light_color = rgb.toHSLA()
			.targetLuminance(_hslluma_required_dark).toRGBA();
	}

	if (lum < _hslluma_required_bright) {
		dark_color = rgb.toHSLA()
			.targetLuminance(_hslluma_required_bright).toRGBA();
	}

	var out = cachedHexColors[color] = {
		light: light_color.toHex(),
		dark: dark_color.toHex()
	};

	return out;
}
