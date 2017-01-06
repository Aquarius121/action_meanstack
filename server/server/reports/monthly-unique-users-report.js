var _ = require('underscore');
var async = require('async');
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var MonthlyReport = reports_module.MonthlyReport;

var audit_database = require('../database/instances/action-audit');
var reports_database = require('../database/instances/action-report');

var types = {
    'unique-users-by-month': {
        build: _handleUniqueUsersByMonth
    }
};

MonthlyUniqueUsersReportBuilder.prototype  = new MonthlyReport();
MonthlyUniqueUsersReportBuilder.prototype.constructor = MonthlyUniqueUsersReportBuilder;

function MonthlyUniqueUsersReportBuilder(max_months_back) {
    MonthlyReport.prototype.constructor.call(this, max_months_back);
}

MonthlyUniqueUsersReportBuilder.prototype.getTypesToProcess = function(from_moment, to_moment, callback2) {
    reports_database.unique_users.distinct('type', {
        from_time: from_moment.valueOf(),
        to_time: to_moment.valueOf()
    }, function(err_types, types_seen) {
        if (err_types) {
            callback2(err_types);
            return;
        }

        var types_to_process = _.difference(_.keys(types), types_seen);
        callback2(null, types_to_process);
    });
};

MonthlyUniqueUsersReportBuilder.prototype.processReportType = function(type, from_moment, to_moment, callback2) {
    var handler = types[type];
    if(handler) {
        handler.build(type, from_moment, to_moment, callback2);
        return;
    }
    winston.error('unknown type ' + type + ' encountered in monthly unique user report builder');
    callback2(null, []);
};

MonthlyUniqueUsersReportBuilder.prototype.queryResults = function(type, context, from_moment, to_moment, callback2) {
    this.standardQuery(reports_database.unique_users, type, context, from_moment, to_moment, callback2);
};

function _handleUniqueUsersByMonth(type, from_moment, to_moment, callback2) {
    winston.debug('processing ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));
    audit_database.logins.aggregate([
            {
                $match: {
                    $and: [
                        { timestamp: {$gte: from_moment.valueOf()} },
                        { timestamp: {$lt: to_moment.valueOf()} }
                    ]
                }
            },
            {
                $group : {
                    _id : { _id: "$caller", platform : "$platform" }
                }
            },
            {
                $group : {
                    _id : "$_id.platform",
                    count : { $sum : 1 }
                }
            },
            {
                $project: {
                    platform: '$_id',
                    count: 1,
                    _id: 0
                }
            }
        ],
        { allowDiskUse: true },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            reports_database.unique_users.insert({
                type: type,
                from_time: from_moment.valueOf(),
                to_time: to_moment.valueOf(),
                duration: to_moment.valueOf() - from_moment.valueOf(),
                values: aggregate_result
            }, function(err_insert) {
                callback2(err_insert, aggregate_result);
            });
        }
    );
}

module.exports = MonthlyUniqueUsersReportBuilder;