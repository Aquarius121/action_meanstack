var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var GenericReport = reports_module.GenericReport;
var aggregation_util = reports_module.AggregationUtils;
var user_aggregation_util = require('../util/user-aggregation-utils');

var general_util = require('../util/general-utils');

var audit_database = require('../database/instances/action-audit');
var reports_database = require('../database/instances/action-report');

var types = {
    'logins-by-platform': _handleLoginsByPlatform,
    'logins-by-platform-and-age': _handleLoginsByPlatformAndAge,
    'logins-by-platform-and-zip': _handleLoginsByPlatformAndZip,
    'logins-by-platform-and-state': _handleLoginsByPlatformAndState,
    'logins-by-platform-and-gender': _handleLoginsByPlatformAndGender

    /*
    , 'logins-by-age': {
        build: _handleLoginsByAge,
        query: _queryLogins
    }
    , 'logins-by-zip': {
        build: _handleLoginsByZip,
        query: _queryLogins
    }
    */
};

DailyLoginsByPlatformReportBuilder.prototype  = new GenericReport();
DailyLoginsByPlatformReportBuilder.prototype.constructor = DailyLoginsByPlatformReportBuilder;

function DailyLoginsByPlatformReportBuilder(max_days_back) {
    GenericReport.prototype.constructor.call(this, types, reports_database.logins, GenericReport.units.DAYS, max_days_back);
}

function _handleLoginsByPlatform(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

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
                _id : "$platform",
                count : { $sum : 1 }
            }
        }],
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            var to_write = _.indexBy(aggregate_result, '_id');
            _.each(_.keys(to_write), function(key) {
                to_write[key] = to_write[key].count;
            });

            GenericReport.saveReport(reports_database.logins, type, from_moment, to_moment, to_write, callback2);
        }
    );
}

function _handleLoginsByPlatformAndAge(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily messages by type report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'age_range',
        projected_name: 'age_range',
        audit_database: audit_database,
        audit_collection: audit_database.logins,
        report_collection: reports_database.logins,
        audit_property: 'platform',
        audit_record_user_id_property: 'caller',
        timestamp_property: 'timestamp',
        timestamp_is_date: false
    }, callback2);
}

function _handleLoginsByPlatformAndZip(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily messages by type report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'address.zip',
        projected_name: 'zip',
        audit_database: audit_database,
        audit_collection: audit_database.logins,
        report_collection: reports_database.logins,
        audit_property: 'platform',
        audit_record_user_id_property: 'caller',
        timestamp_property: 'timestamp',
        timestamp_is_date: false
    }, callback2);
}

function _handleLoginsByPlatformAndState(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily messages by type report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'address.state',
        projected_name: 'state',
        audit_database: audit_database,
        audit_collection: audit_database.logins,
        report_collection: reports_database.logins,
        audit_property: 'platform',
        audit_record_user_id_property: 'caller',
        timestamp_property: 'timestamp',
        timestamp_is_date: false
    }, callback2);
}

function _handleLoginsByPlatformAndGender(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily messages by type report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'gender',
        projected_name: 'gender',
        audit_database: audit_database,
        audit_collection: audit_database.logins,
        report_collection: reports_database.logins,
        audit_property: 'platform',
        audit_record_user_id_property: 'caller',
        timestamp_property: 'timestamp',
        timestamp_is_date: false
    }, callback2);
}

function _handleLoginsByAge(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnUsers(type, from_moment, to_moment, {
        user_property: 'age_range',
        projected_name: 'age_range',
        audit_collection: audit_database.logins,
        report_collection: reports_database.logins,
        audit_record_user_id_property: 'caller'
    }, callback2);
}

function _handleLoginsByZip(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnUsers(type, from_moment, to_moment, {
        user_property: 'address.zip',
        projected_name: 'zip',
        audit_collection: audit_database.logins,
        report_collection: reports_database.logins,
        audit_record_user_id_property: 'caller'
    }, callback2);
}

module.exports = DailyLoginsByPlatformReportBuilder;