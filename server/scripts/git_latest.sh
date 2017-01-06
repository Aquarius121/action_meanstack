#!/bin/bash
# gets the latest source from master of the current repo
cd ..
git reset --hard
git pull --rebase origin master
