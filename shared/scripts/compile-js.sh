#!/bin/bash
# requires npm install -g uglify-js
JS_FILES="../action-widgets/*";
JS_FILES+=" ../common-widgets/*";

COMPILATION_LEVEL="SIMPLE_OPTIMIZATIONS"
#COMPILATION_LEVEL="NONE"

if [ $COMPILATION_LEVEL == "NONE" ]
then
    # concatenate files
    for file in $JS_FILES; do cat $file >> common-widgets.js; done
else
    # -c or ----consolidate-primitive-values
    # Consolidates null, Boolean, and String values. Known as aliasing in the Closure
    # Compiler. Worsens the data compression ratio of gzip.
    uglifyjs $JS_FILES --output common-widgets.js -c
fi

cp ./common-widgets.js ../../server/public/js/widgets/
cp ./common-widgets.js ../../mobile/cordova/www/js/widgets/
rm ./common-widgets.js