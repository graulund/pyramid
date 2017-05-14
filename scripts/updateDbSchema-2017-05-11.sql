BEGIN TRANSACTION;
ALTER TABLE "ircChannels" RENAME TO 'ircChannels_ME_TMP';
CREATE TABLE "ircChannels" (
"channelId" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"serverId" INTEGER NOT NULL REFERENCES "ircServers"("serverId"),
"name" TEXT NOT NULL,
"displayName" TEXT,
"lastSeenTime" TEXT,
"lastSeenUsername" TEXT,
"lastSeenDisplayName" TEXT,
"isEnabled" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "ircChannels"  ("channelId", "serverId", "name", "lastSeenTime", "lastSeenUsername", "lastSeenDisplayName", "isEnabled") SELECT "channelId", "serverId", "name", "lastSeenTime", "lastSeenUsername", "lastSeenDisplayName", "isEnabled" FROM "ircChannels_ME_TMP";
DROP TABLE "ircChannels_ME_TMP";
CREATE UNIQUE INDEX "serverChannel" ON "ircChannels" ("serverId", "name");
COMMIT;
