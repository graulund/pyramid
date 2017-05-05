#!/bin/sh
command -v sqlite3 >/dev/null 2>&1 || { echo >&2 "This script requires the sqlite3 command line tool, but it's not installed. Aborting."; exit 1; }
sqlite3 ../data/pyramid.db < clearDatabaseLogs.sql
