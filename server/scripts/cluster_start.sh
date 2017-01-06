#!/bin/bash
cd ..
nohup forever start app.js &
export NODE_APP_INSTANCE=2
nohup forever start app.js &