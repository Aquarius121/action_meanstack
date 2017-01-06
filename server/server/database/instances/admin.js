var winston = require('winston');

var MongoDB             = require('mongodb').Db;
var Server              = require('mongodb').Server;
var config              = require('config');

var dbPort              = config['storage'].port;
var dbHost              = config['storage'].host;
var dbName              = config['storage'].name;

exports.status = {};
exports.refreshStatus = _refreshStatus;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});

db.open(function(e) { // , data
    if (e) {
        winston.error(e);
        return;
    }

    winston.info('connected to database :: admin ... authenticating...');
    var adminDb = db.admin();
    adminDb.authenticate(config['storage'].user, config['storage'].password, function(err_auth) { // , result
        if (err_auth) {
            winston.error('an error occurred while authenticating with the admin database: ' + err_auth);
            return;
        }

        winston.info("database authentication for admin successful");

        exports.admin = adminDb;

        _refreshStatus(function(err_status, result_status) {

        });
    });

});

function _refreshStatus(callback2) {
    exports.admin.serverStatus(function(err_status, info) {
        if(err_status) {
            callback2(err_status);
            return;
        }

        exports.status.version = info.version;
        exports.status.process = info.process;
        exports.status.pid = info.pid;
        exports.status.uptime = info.uptime; // since we aren't currently updating frequently, we don't use this

        callback2(exports.status);
    });
}