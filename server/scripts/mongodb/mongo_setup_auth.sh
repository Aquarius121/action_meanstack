#!/bin/bash
# requires auth=false in /etc/mongod.conf and mongod is running

# set up root admin (can do this with auth off, or existing root admin)
#mongo -u <existing admin user> -p <existing admin password> --authenticationDatabase admin admin "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: [ { role: 'root', db: 'admin' } ]})"
#mongo --eval admin "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: [ { role: 'root', db: 'admin' } ]})"

# add auth to other databases
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-audit --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-cache --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-feedback --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-log --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-message --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-reference --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-report --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin product-info --eval "db.createUser({ user: 'admin', pwd: '3nc0de123', roles: []})"

mongo -u admin -p 3nc0de123 --authenticationDatabase admin action --eval "db.updateUser('admin', {roles: [ { role: 'readWrite', db: 'action' }, { role: 'dbAdmin', db: 'action' } ] })"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-audit --eval "db.updateUser('admin', {roles: [  { role: 'readWrite', db: 'action-audit' }, { role: 'dbAdmin', db: 'action-audit' } ] })"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-cache --eval "db.updateUser('admin', {roles: [  { role: 'readWrite', db: 'action-cache' }, { role: 'dbAdmin', db: 'action-cache' } ] })"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-feedback --eval "db.updateUser('admin', {roles: [  { role: 'readWrite', db: 'action-feedback' }, { role: 'dbAdmin', db: 'action-feedback' } ] })"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-log --eval "db.updateUser('admin', {roles: [  { role: 'readWrite', db: 'action-log' }, { role: 'dbAdmin', db: 'action-log' } ] })"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-message --eval "db.updateUser('admin', {roles: [  { role: 'readWrite', db: 'action-message' }, { role: 'dbAdmin', db: 'action-message' } ] })"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-reference --eval "db.updateUser('admin', {roles: [  { role: 'readWrite', db: 'action-reference' }, { role: 'dbAdmin', db: 'action-reference' } ] })"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin action-report --eval "db.updateUser('admin', {roles: [  { role: 'readWrite', db: 'action-report' }, { role: 'dbAdmin', db: 'action-report' } ] })"
mongo -u admin -p 3nc0de123 --authenticationDatabase admin product-info --eval "db.updateUser('admin', {roles: [  { role: 'readWrite', db: 'product-info' }, { role: 'dbAdmin', db: 'product-info' } ] })"
