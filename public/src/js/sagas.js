import appConfig from "./sagas/appConfig";
import channelCaches from "./sagas/channelCaches";
import deviceState from "./sagas/deviceState";
import ircConfigs from "./sagas/ircConfigs";

const sagas = [
	appConfig,
	channelCaches,
	deviceState,
	ircConfigs
];

export default sagas;
