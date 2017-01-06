var config = require('config');
var exec = require('child_process').exec;
var response_times = require('node-response-time-tracking');
var winston = require('winston');

var admin_database = require('../database/instances/admin');
var database = require('../database/database');
var node_server_monitor = require('node-server-monitor');
var database_monitor = node_server_monitor.mongo_database_monitor;
var logs_database = require('../database/instances/action-log');

var jobs = require('../jobs');
var solr = require('../solr');

var general_util = require('../util/general-utils');
var user_util = require('../util/user-utils');

module.exports = {
    resources_get: _handleResourcesGet,
    resources_view: _handleResourcesView,

    logs_view: _handleLogsView,
    logs_get: _handleGetLogs,

    response_times_view: _handleResponseTimesView,
    response_times_get: _handleResponseTimesGet,
    response_times_delete: _handleResponseTimesDelete
};

function _handleResourcesGet(req, res) {
    node_server_monitor.disk_monitor.getDiskSpace(config.disks, function(err, disk_result) {
        node_server_monitor.cpu_monitor.getCPUHistory(function (cpu_result) {
            node_server_monitor.system_info.getInfo(function(info) {
                solr.ping(function(err_ping, ping_result) {
                    res.send({
                        cpu: cpu_result,
                        disk: disk_result,
                        info: info,
                        database: database_monitor.stats,
                        status: admin_database.status,
                        solr_connected: !(!ping_result || !ping_result.status || ping_result.status != 'OK')
                    }, 200);
                });

            });
        });
    });
}

function _handleResourcesView(req, res) {
    res.render('system-resources', {
        caller: user_util.getCaller(req),
        title: 'System Resources',
        url: req.url
    });
}

function _handleLogsView(req, res) {
    res.render('system-logs', {
        caller: user_util.getCaller(req),
        title: 'System logs',
        url: req.url
    });
}

function _handleGetLogs(req, res) {
    var query = {}, sort_by = {};
    general_util.buildTableQuery(req.query.sort, req.query.filter, req.query.filter_date, query, sort_by);

    var fields = {
        _id: 1,
        timestamp: 1,
        level: 1,
        hostname: 1,
        label: 1,
        message: 1
    };

    database.query(logs_database.logs,
        {
            query: query,
            fields: fields,
            sort_by: sort_by,
            page: req.query['page'],
            pageSize: req.query['pageSize'],
            case_sensitive: true
        },
        function(err_query, query_result) {
            if(err_query) {
                res.send(err_query, 500);
                return;
            }
            res.send(query_result, 200);
        }
    );
}

function _handleResponseTimesGet(req, res) {
    res.send({
        response_times: response_times.response_times,
        long_requests: response_times.long_requests,
        long_request_threshold: response_times.long_request_threshold,
        longest_requests: response_times.longest_requests
    }, 200);
}

function _handleResponseTimesDelete(req, res) {
    if(req.param('times') || req.param('all')) {
        response_times.clearResponseTimes();
    }

    if(req.param('long-requests') || req.param('all')) {
        response_times.clearLongRequests();
    }

    if(req.param('longest-requests') || req.param('all')) {
        response_times.clearLongestRequests();
    }

    res.send({ result: 'ok' }, 200);
}

function _handleResponseTimesView(req, res) {
    res.render('response-times', {
        caller: user_util.getCaller(req),
        title: 'Response Times',
        url: req.url
    });
}

/*
exec('prince -v builds/pdf/book.html -o builds/pdf/book.pdf', function (error, stdout, stderr) {
    // output is in stdout
});
    */

/*
 var spawn = require('child_process').spawn;
 var child = spawn('prince', ['-v', 'builds/pdf/book.html', '-o', 'builds/pdf/book.pdf']);

 child.stdout.on('data', function(chunk) {
 // output here
 });
 */

// require('child_process').execFile()