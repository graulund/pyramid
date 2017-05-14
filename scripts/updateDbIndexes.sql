DROP INDEX "username";
DROP INDEX "date";
DROP INDEX "channelId";
CREATE INDEX "channelDateTime" ON "lines" ("channelId","time","date");
CREATE INDEX "usernameDateTime" ON "lines" ("time","date","username");
VACUUM;
