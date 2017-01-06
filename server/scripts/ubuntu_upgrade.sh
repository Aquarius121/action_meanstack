#!/bin/bash
sudo apt-get update
sudo apt-get upgrade
sudo apt-get dist-upgrade
sudo do-release-upgrade

# use npm to upgrade node
sudo npm cache clean -f
sudo npm install -g n
sudo n stable