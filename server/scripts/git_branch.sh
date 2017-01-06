#!/bin/bash
# gets the latest source from a branch of the current repo
cd ..
git reset --hard
set +e
git checkout -b $1 2>/dev/null
set -e
git pull --rebase origin $1
