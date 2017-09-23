const _ = require("lodash");

// Query utility

const getTimestamp = function(t) {

	if (t && t instanceof Date) {
		return t.toISOString();
	}

	return t;
};

const nameValueRowsToObject = function(rows) {
	var output = {};
	if (rows && rows.length) {
		rows.forEach((row) => {
			if (row && row.name) {
				output[row.name] = row.value;
			}
		});
	}

	return output;
};

const formatIn = function(list) {
	if (list && list instanceof Array) {
		const json = JSON.stringify(list);
		if (json) {
			return "(" + json.substr(1, json.length-2) + ")";
		}
	}

	return "()";
};

const dollarize = function(data) {
	const out = {};
	_.forOwn(data, (value, key) => {
		out["$" + key] = value;
	});
	return out;
};

const onlyParamsInQuery = function(params, query) {
	const out = {};

	if (params && query) {
		_.forOwn(params, (value, key) => {
			if (query.indexOf(key) >= 0) {
				out[key] = value;
			}
		});
	}

	return out;
};

const oq = function(col, isDesc = false) {
	const dir = isDesc ? "DESC" : "ASC";
	return `ORDER BY ${col} ${dir}`;
};

const sq = function(table, selectCols, whereCols = [], joins = "") {
	const select = selectCols.join(", ");
	const where = whereCols.map((w) => `${w} = \$${w}`).join(" AND ");
	return `SELECT ${select} FROM ${table}` +
		(joins ? " " + joins : "") +
		(where ? ` WHERE ${where}` : "");
};

const uq = function(table, setCols, whereCols) {
	const set = setCols.map((s) => `${s} = \$${s}`).join(", ");
	const where = whereCols.map((w) => `${w} = \$${w}`).join(" AND ");
	return `UPDATE ${table} SET ${set} WHERE ${where}`;
};

const iq = function(table, colNames) {
	const cols = colNames.join(", ");
	const vals = colNames.map((c) => "$" + c).join(", ");
	return `INSERT INTO ${table} (${cols}) VALUES (${vals})`;
};

const miq = function(table, colNames, amount) {
	let cols = colNames.join(", ");
	let out = `INSERT INTO ${table} (${cols}) VALUES `;
	let valueStrings = [];

	for (var i = 0; i < amount; i++) {
		let vals = colNames.map((c) => "$" + c + i).join(", ");
		valueStrings.push(`(${vals})`);
	}

	return out + valueStrings.join(", ");
};

const dq = function(table, whereCols) {
	const where = whereCols.map((w) => `${w} = \$${w}`).join(" AND ");
	return `DELETE FROM ${table} WHERE ${where}`;
};

module.exports = {
	dollarize,
	dq,
	formatIn,
	getTimestamp,
	iq,
	miq,
	nameValueRowsToObject,
	onlyParamsInQuery,
	oq,
	sq,
	uq
};
