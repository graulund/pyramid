-- Channels table
BEGIN TRANSACTION;
ALTER TABLE "ircChannels" RENAME TO 'ircChannels_ME_TMP';
CREATE TABLE "ircChannels" (
"channelId" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"serverId" INTEGER NOT NULL REFERENCES "ircServers"("serverId"),
"name" TEXT NOT NULL,
"lastSeenTime" TEXT,
"lastSeenUsername" TEXT,
"lastSeenDisplayName" TEXT,
"isEnabled" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "ircChannels"  ("channelId", "serverId", "name", "lastSeenTime", "lastSeenUsername", "isEnabled") SELECT "channelId", "serverId", "name", "lastSeenTime", "lastSeenUsername", "isEnabled" FROM "ircChannels_ME_TMP";
DROP TABLE "ircChannels_ME_TMP";
CREATE UNIQUE INDEX "serverChannel" ON "ircChannels" ("serverId", "name");
COMMIT;

-- Friends table
BEGIN TRANSACTION;
ALTER TABLE "friends" RENAME TO 'friends_ME_TMP';
CREATE TABLE "friends" (
"friendId" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"serverId" INTEGER NOT NULL,
"username" TEXT NOT NULL,
"lastSeenTime" TEXT,
"lastSeenChannelId" INTEGER,
"isBestFriend" INTEGER DEFAULT 0 NOT NULL,
"isEnabled" INTEGER DEFAULT 1 NOT NULL,
"displayName" TEXT
);
INSERT INTO "friends"  ("friendId", "serverId", "username", "lastSeenTime", "lastSeenChannelId", "isBestFriend", "isEnabled") SELECT "friendId", "serverId", "username", "lastSeenTime", "lastSeenChannelId", "isBestFriend", "isEnabled" FROM "friends_ME_TMP";
DROP TABLE "friends_ME_TMP";
CREATE UNIQUE INDEX "serverUser" ON "friends" ("serverId", "username");
COMMIT;
