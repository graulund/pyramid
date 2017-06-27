DROP INDEX "serverChannel";
CREATE UNIQUE INDEX "serverChannel" ON "ircChannels" ("serverId","channelType","name");
