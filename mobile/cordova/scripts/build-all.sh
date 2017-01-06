#!/bin/sh
cd ..
cordova platform add android
cordova platform add ios
cordova build
cd scripts
./copy-resources.sh
cd ..
cordova build
cd -
