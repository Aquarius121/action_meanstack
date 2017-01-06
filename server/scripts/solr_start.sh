#!/bin/bash
# starts solr - will not check for existing instances
cd ~/solr/solr-4.6.1/container
nohup java -jar start.jar &

#https://wiki.apache.org/solr/SolrSecurity
#tar --exclude=~/solr/solr-4.6.1/container/solr/products/data -czvf ~/Desktop/solr_cores.tgz ~/solr/solr-4.6.1/container/