#!/bin/bash
# starts node with an always wrapper
cd ..
nohup forever start app.js &
