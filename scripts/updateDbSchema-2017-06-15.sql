BEGIN TRANSACTION;
ALTER TABLE "lines" RENAME TO 'lines_ME_TMP';
CREATE TABLE "lines" (
"lineId" TEXT PRIMARY KEY,
"channelId" INTEGER NOT NULL REFERENCES "ircChannels"("channelId"),
"type" TEXT NOT NULL,
"time" TEXT NOT NULL,
"date" TEXT NOT NULL,
"username" TEXT,
"message" TEXT,
"symbol" TEXT,
"tags" TEXT,
"eventData" TEXT,
"isHighlight" INTEGER
);
INSERT INTO "lines"  ("lineId", "channelId", "type", "time", "date", "username", "message", "symbol", "tags", "eventData") SELECT "lineId", "channelId", "type", "time", "date", "username", "message", "symbol", "tags", "eventData" FROM "lines_ME_TMP";
DROP TABLE "lines_ME_TMP";
CREATE INDEX "usernameDateTime" ON "lines" ("time", "date", "username");
CREATE INDEX "channelDateTime" ON "lines" ("channelId", "time", "date");
CREATE INDEX "isHighlight" ON "lines" ("isHighlight");
COMMIT;
