/*eslint no-undef: 0*/
import React from "react";
import PropTypes from "prop-types";

import buildNumber from "../buildNumber";
import { VERSION } from "../constants";

const block = "version";

const VERSION_NAMES = {
	1:  "beta 1",
	46: "beta 2",
	74: "beta 3",
	97: "beta 4"
};

const VersionNumber = function(props) {
	let { verbose } = props;
	let hasName = !!VERSION_NAMES[buildNumber];

	var buildText;

	if (hasName) {
		buildText = VERSION_NAMES[buildNumber] +
			(verbose ? ` (build ${buildNumber})` : "");
	}
	else {
		buildText = `build ${buildNumber}`;
	}

	var text = verbose ? `${VERSION} ${buildText}` : buildText;

	if (__DEV__) {
		text += verbose ? " (dev)" : " dev";
	}

	let className = block +
		(hasName ? ` ${block}--named` : "");

	return <span className={className}>{ text }</span>;
};

VersionNumber.propTypes = {
	verbose: PropTypes.bool
};

export default VersionNumber;
