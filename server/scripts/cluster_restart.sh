#!/bin/bash
cd ..
process_count=$(forever list | wc -l)
if [ $process_count -gt 1 ]
then
    echo "stopping instance 1"
    forever stop 0
    echo "restarting instance 1"
    nohup forever start app.js &
    echo "waiting to allow instance 1 to get stable"
    sleep 20
    echo "stopping process 2"
    forever stop 0
    echo "restarting process 2"
    export NODE_APP_INSTANCE=2
    nohup forever start app.js &
else
    echo "starting 2 instances"
    nohup forever start app.js &
    export NODE_APP_INSTANCE=2
    nohup forever start app.js &
fi