var _ = require('underscore');
var async = require('async');
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var GenericReport = reports_module.GenericReport;

var action_database = require('../database/instances/action');
var reports_database = require('../database/instances/action-report');

var types = {
    'users-by-zip': _handleUsersByZip,
    'users-by-state': _handleUsersByState,
    'users-by-age': _handleUsersByAge,
    'users-by-gender': _handleUsersByGender
};

DailyUserProfileReportBuilder.prototype  = new GenericReport();
DailyUserProfileReportBuilder.prototype.constructor = DailyUserProfileReportBuilder;

function DailyUserProfileReportBuilder(max_days_back) {
    GenericReport.prototype.constructor.call(this, types, reports_database.user_profile, GenericReport.units.DAYS, max_days_back);
}

function _handleUsersByZip(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily user profile report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    action_database.user_account.aggregate(
        {
            $match: { role: 'user' }
        },
        {
            $group : { _id : "$address.zip", count : { $sum : 1 } }
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            var to_write = _.indexBy(aggregate_result, '_id');
            _.each(_.keys(to_write), function(key) {
                to_write[key] = to_write[key].count;
            });

            GenericReport.saveReport(reports_database.user_profile, type, from_moment, to_moment, to_write, callback2);
        }
    );
}

function _handleUsersByState(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily user profile report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));
    action_database.user_account.aggregate(
        {
            $match: { role: 'user' }
        },
        {
            $group : { _id : "$address.state", count : { $sum : 1 } }
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            var to_write = _.indexBy(aggregate_result, '_id');
            _.each(_.keys(to_write), function(key) {
                to_write[key] = to_write[key].count;
            });

            GenericReport.saveReport(reports_database.user_profile, type, from_moment, to_moment, to_write, callback2);
        }
    );
}

function _handleUsersByAge(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily user profile report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));
    action_database.user_account.aggregate(
        {
            $match: { role: 'user' }
        },
        {
            $group : { _id : "$age_range", count : { $sum : 1 } }
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            var to_write = _.indexBy(aggregate_result, '_id');
            _.each(_.keys(to_write), function(key) {
                to_write[key] = to_write[key].count;
            });

            GenericReport.saveReport(reports_database.user_profile, type, from_moment, to_moment, to_write, callback2);
        }
    );
}

function _handleUsersByGender(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily user profile report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));
    action_database.user_account.aggregate(
        {
            $match: { role: 'user' }
        },
        {
            $group : { _id : "$gender", count : { $sum : 1 } }
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            var to_write = _.indexBy(aggregate_result, '_id');
            _.each(_.keys(to_write), function(key) {
                to_write[key] = to_write[key].count;
            });

            GenericReport.saveReport(reports_database.user_profile, type, from_moment, to_moment, to_write, callback2);
        }
    );
}

module.exports = DailyUserProfileReportBuilder;