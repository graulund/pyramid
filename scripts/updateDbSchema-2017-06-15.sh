#!/bin/sh

echo "WARNING: Depending on how many logs you've got in your database, this update could take a LONG time."
echo ""
echo "If you want to speed it up, you can delete all of your logs in the database by aborting and running this first: ./clearDatabaseLogs.sh"
echo ""
echo "Otherwise you'll just have to wait it out. With tons of data, it might take up to an hour before this command is done."

echo -n " Do you want to continue? [y/n] "
read answer
if echo "$answer" | grep -iq "^y" ;then
	sqlite3 ../data/pyramid.db < updateDbSchema-2017-06-15.sql
fi
