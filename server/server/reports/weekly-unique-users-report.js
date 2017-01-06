var _ = require('underscore');
var async = require('async');
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var WeeklyReport = reports_module.WeeklyReport;

var audit_database = require('../database/instances/action-audit');
var reports_database = require('../database/instances/action-report');

var types = {
    'unique-users-by-week': {
        build: _handleUniqueUsersByWeek
    }
};

WeeklyUniqueUsersReportBuilder.prototype  = new WeeklyReport();
WeeklyUniqueUsersReportBuilder.prototype.constructor = WeeklyUniqueUsersReportBuilder;

function WeeklyUniqueUsersReportBuilder(max_weeks_back) {
    WeeklyReport.prototype.constructor.call(this, max_weeks_back);
}

WeeklyUniqueUsersReportBuilder.prototype.getTypesToProcess = function(from_moment, to_moment, callback2) {
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

WeeklyUniqueUsersReportBuilder.prototype.processReportType = function(type, from_moment, to_moment, callback2) {
    var handler = types[type];
    if(handler) {
        handler.build(type, from_moment, to_moment, callback2);
        return;
    }
    winston.error('unknown type ' + type + ' encountered in weekly unique user report builder');
    callback2(null, []);
};

WeeklyUniqueUsersReportBuilder.prototype.queryResults = function(type, context, from_moment, to_moment, callback2) {
    this.standardQuery(reports_database.unique_users, type, context, from_moment, to_moment, callback2);
};

function _handleUniqueUsersByWeek(type, from_moment, to_moment, callback2) {
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

module.exports = WeeklyUniqueUsersReportBuilder;