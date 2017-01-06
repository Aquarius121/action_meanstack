#!/bin/sh
# note that the sed statement below has only been tested on mac
cd ..
cordova platform remove android
cordova platform add android
android update project --subprojects --path "platforms/android" --target android-19 --library "FacebookLib"
cordova build android
cd scripts
./copy-resources.sh
cd ..
cordova build android --release
