var _ = require('underscore');
var async = require('async');
var moment = require('moment');

var general_util = require('../util/general-utils');
var user_util = require('../util/user-utils');

var report_manager = require('reports-using-mongo').ReportsManager;
var reports_database = require('../database/instances/action-report');

module.exports = {
    user_profile_report_view: _userProfileReportView,
    action_statistics_report_view: _actionStatisticsView,
    action_activity_report_view: _actionActivityView,

    reports_get: _handleGetReport,
    reports_brand_get: _handleGetBrandReport,
    reports_delete: _handleDeleteReports
};

function _userProfileReportView(req, res) {
    var caller = user_util.getCaller(req);

    res.render('report-user-profile', {
        caller: caller,
        title: 'User Profile Report',
        url: req.url
    });
}

function _actionStatisticsView(req, res) {
    var caller = user_util.getCaller(req);
    res.render('report-action-statistics', {
        caller: caller,
        title: 'Action Statistics Report',
        url: req.url
    });
}

function _actionActivityView(req, res) {
    var caller = user_util.getCaller(req);
    res.render('report-action-activity', {
        caller: caller,
        title: 'Action Activity Report',
        url: req.url
    });
}

function _handleGetReport(req, res) {
    var caller = user_util.getCaller(req);

    // snag params
    var report_type = req.param('report');
    var type = req.param('type');
    var brand = req.param('brand'); // optional

    var limit = 10000;
    if(req.param('limit')) {
        try {
            limit = parseInt(req.param('limit'));
        } catch(ex) {
            res.send('could not parse limit');
            return;
        }
    }

    // TODO: paging?

    // validate params
    if(!type) {
        res.send('report subtype not provided', 500);
        return;
    }

    var report_handler = report_manager.report_handlers[report_type];
    if(!report_handler) {
        res.send('report handler not found', 500);
        return;
    }

    var from = req.query['from'], to = req.query['to'];
    if(!from || !to) {
        res.send('both from and to must be provided', 500);
        return;
    }

    try {
        from = parseInt(from);
        to = parseInt(to);
    } catch(ex) {
        res.send('could not parse numbers from timeframe', 500);
        return;
    }

    var context = {
        limit: limit,
        caller: caller
    };

    if(caller.role != 'admin' && caller.role != 'action-admin') {
        // TODO: maybe load user to be sure we have the most up-to-date brand list
        if(brand) {
            context.brands = _.intersection([brand], caller.managed_brands);
        } else {
            context.brands = caller.managed_brands;
        }
    } else if(brand) {
        context.brands = [brand];
    }

    report_handler.queryResults(type, context, moment(from), moment(to), function(err_query, query_results) {
        if(err_query) {
            res.send(err_query, 500);
            return;
        }

        var format = req.query['format'];
        if(format) {
            if(format == 'csv') {
                res.charset = 'utf-8';
                res.header('Content-Type', 'text/csv');
                res.send(_getCSV(report_type, query_results), 200);
                return;
            }
        }
        res.send(query_results, 200);
    });
}

function _handleGetBrandReport(req, res) {
    var brand = req.param('brand');
    if(!general_util.isValidId(brand)) {
        res.send('invalid format for id', 500);
        return;
    }

    var caller = user_util.getCaller(req);
    if(caller.role != 'admin' && caller.role != 'brand-manager') {
        general_util.send404(res);
        return;
    }

    var report_type = req.param('report');
    var type = req.param('type');

    var limit = 10000;
    if(req.param('limit')) {
        try {
            limit = parseInt(req.param('limit'));
        } catch(ex) {
            res.send('could not parse limit');
            return;
        }
    }

    // TODO: paging?

    if(!type) {
        res.send('report subtype not provided', 500);
        return;
    }

    var report_handler = report_manager.report_handlers[report_type];
    if(!report_handler) {
        res.send('report handler not found', 500);
        return;
    }

    var from = req.query['from'], to = req.query['to'];
    if(!from || !to) {
        res.send('both from and to must be provided', 500);
        return;
    }

    try {
        from = parseInt(from);
        to = parseInt(to);
    } catch(ex) {
        res.send('could not parse numbers from timeframe', 500);
        return;
    }

    var context = {
        limit: limit,
        brands: [brand]
    };

    // if the user isn't an admin, we need to brand-scope
    if(caller.role != 'admin') {
        context.brands = _.uniq(context.brands.concat(caller.managed_brands));
    }

    report_handler.queryResults(type, context, moment(from), moment(to), function(err_query, query_results) {
        if(err_query) {
            res.send(err_query, 500);
            return;
        }

        var format = req.query['format'];
        if(format) {
            if(format == 'csv') {
                res.charset = 'utf-8';
                res.header('Content-Type', 'text/csv');
                res.send(_getCSV(report_type, query_results), 200);
                return;
            }
        }
        res.send(query_results, 200);
    });
}

// TODO: move this to report handler!!!
function _getCSV(type, reports) {
    var contents;

    if(type == 'where_to_buys') {
        contents = '"Date","web","ios","android"';
        _.each(reports, function(report) {
            contents += '\n';
            contents += moment(report.from_time).format('MM/DD/YYYY');
            contents += ',' + (report.values.web ? report.values.web.count : '0');
            contents += ',' + (report.values.ios ? report.values.ios.count : '0');
            contents += ',' + (report.values.android ? report.values.android.count : '0');
        });
        return contents;
    }

    if(type == 'daily_action_statistics_report') {
        var totals_by_id = {};
        _.each(reports, function(day_record) {
            _.each(_.keys(day_record.values), function(value_key) {
                if(typeof(totals_by_id[value_key]) == 'undefined') {
                    totals_by_id[value_key] = day_record.values[value_key];
                    return;
                }
                totals_by_id[value_key].scanned += day_record.values[value_key].scanned;
                totals_by_id[value_key].searched += day_record.values[value_key].searched;
            });
        });

        contents = '"brand","product","scanned","searched","participated"';
        _.each(_.keys(totals_by_id), function(totals_key) {
            var value = totals_by_id[totals_key];
            contents += '\n';
            contents += '\"' + (value.brand_name ? value.brand_name : 'Unknown brand') + '\"';
            contents += ',' + '\"' + (value.product_name ? value.product_name : value.code) + '\"';
            contents += ',' + '\"' + (value.scanned ? value.scanned : 0) + '\"';
            contents += ',' + '\"' + (value.searched ? value.searched : 0) + '\"';
            contents += ',' + '\"' + value.participates + '\"';
        });

        return contents;
    }

    contents = '"Date","web","ios","android"';
    _.each(reports, function(report) {
        contents += '\n';
        contents += moment(report.from_time).format('MM/DD/YYYY');
        contents += ',' + (report.values.web ? report.values.web : '0');
        contents += ',' + (report.values.ios ? report.values.ios : '0');
        contents += ',' + (report.values.android ? report.values.android : '0');
    });
    return contents;
}

function _handleDeleteReports(req, res) {
    var since = req.param('since');
    var until = req.param('until');

    if(!since && !until) {
        res.send('since or until must be provided', 500);
        return;
    }

    if(until){
        res.send('not implemented', 500);
        return;
    }

    since = parseInt(since);
    until = parseInt(until);

    _cleanReportsSince(since, function(err_clean, clean_result) {
        if(err_clean) {
            res.send(err_clean, 500);
            return;
        }

        res.send('{result: "ok"}', 200);
    });
}

function _cleanReportsSince(since_timestamp, callback2) {
    reports_database.db.collections(function(err_collections, collections) {
        if(err_collections) {
            callback2(err_collections);
            return;
        }

        if(!collections) {
            callback2('no collections found');
            return;
        }

        var tasks = [];

        collections.forEach(function(collection) {
            tasks.push(function(callback) {
                if(collection.collectionName.lastIndexOf('system') == 0) {
                    callback();
                } else {
                    collection.remove({
                        from_time: {$gte: since_timestamp} // to_time or from_time?
                    }, function(err_remove, remove_result) {
                        callback(err_remove, remove_result);
                    });
                }
            });
        });

        async.series(tasks, function(err_async, async_result) {
            callback2(err_async, async_result);
        });
    });
}
