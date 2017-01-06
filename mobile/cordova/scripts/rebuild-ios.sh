#!/bin/sh
cd ..
cordova platform remove ios
cordova platform add ios
cordova build ios
cd scripts
./copy-resources.sh
cd ..
cordova build ios
