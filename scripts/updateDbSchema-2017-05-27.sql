BEGIN TRANSACTION;
ALTER TABLE "ircServers" RENAME TO 'ircServers_ME_TMP';
CREATE TABLE "ircServers" (
"serverId" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"name" TEXT NOT NULL UNIQUE,
"hostname" TEXT NOT NULL,
"port" INTEGER NOT NULL,
"secure" INTEGER,
"username" TEXT,
"password" TEXT,
"passwordNonce" TEXT,
"nickname" TEXT NOT NULL,
"isEnabled" INTEGER NOT NULL DEFAULT 1,
"realname" TEXT,
"selfSigned" INTEGER,
"certExpired" INTEGER
);
INSERT INTO "ircServers"  ("serverId", "name", "hostname", "port", "secure", "username", "password", "nickname", "isEnabled", "realname", "selfSigned", "certExpired") SELECT "serverId", "name", "hostname", "port", "secure", "username", "password", "nickname", "isEnabled", "realname", "selfSigned", "certExpired" FROM "ircServers_ME_TMP";
DROP TABLE "ircServers_ME_TMP";
COMMIT;
