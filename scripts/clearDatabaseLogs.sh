#!/bin/bash
command -v sqlite3 >/dev/null 2>&1 || { echo >&2 "This script requires the sqlite3 command line tool, but it's not installed. Aborting."; exit 1; }

echo -n "WARNING: You are about to delete all logs in your Pyramid database. Do you wish to continue? [y/n] "
read answer
if echo "$answer" | grep -iq "^y" ;then
	sqlite3 ../data/pyramid.db < clearDatabaseLogs.sql
fi
