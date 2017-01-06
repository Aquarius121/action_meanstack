#!/bin/sh
# sample usage: ./mongo_dump_collection.sh product-info ean
filename=$(date +"%Y%m%d%H%M")_$1
mongodump --out $filename --username admin --password '3nc0de123' --db $1 --collection $2
