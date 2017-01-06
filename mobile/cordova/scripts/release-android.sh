#!/bin/sh
echo Note that this script does not do a full rebuild of Android!!!
echo Don\'t forget to update the versionCode in AndroidManifest.xml!!!
./rebuild-android.sh
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../config/my-release-key.keystore -storepass Acti0nSnowm4nMidd1e -keypass Custom3rRailw4yPot7y ../platforms/android/ant-build/CordovaApp-release-unsigned.apk action
zipalign -v 4 ../platforms/android/ant-build/CordovaApp-release-unsigned.apk Action.apk
