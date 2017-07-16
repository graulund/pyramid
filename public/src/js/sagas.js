import appConfig from "./sagas/appConfig";
import channelCaches from "./sagas/channelCaches";
import ircConfigs from "./sagas/ircConfigs";

const sagas = [
	appConfig,
	channelCaches,
	ircConfigs
];

export default sagas;
