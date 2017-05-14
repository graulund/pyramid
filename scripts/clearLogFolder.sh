#!/bin/bash
echo -n "WARNING: You are about to delete all logs in your Pyramid log folder. Do you wish to continue? [y/n] "
read answer
if echo "$answer" | grep -iq "^y" ;then
	rm -rf ../public/data/logs/*
fi
