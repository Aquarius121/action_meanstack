var _ = require('underscore');
var async = require('async');
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var DailyReport = reports_module.DailyReport;
var aggregation_util = reports_module.AggregationUtils;
var user_aggregation_util = require('../util/user-aggregation-utils');

var audit_database = require('../database/instances/action-audit');
var reports_database = require('../database/instances/action-report');

var types = {
    'registrations-by-platform': {
        build: _buildRegistrationsByPlatform
    }
    , 'registrations-by-platform-and-age': {
        build: _buildRegistrationsByPlatformAndAge
    }
    , 'registrations-by-platform-and-zip': {
        build: _buildRegistrationsByPlatformAndZip
    }
    , 'registrations-by-platform-and-state': {
        build: _buildRegistrationsByPlatformAndState
    }
    , 'registrations-by-platform-and-gender': {
        build: _buildRegistrationsByPlatformAndGender
    }
};

DailyRegistrationReportBuilder.prototype  = new DailyReport();
DailyRegistrationReportBuilder.prototype.constructor = DailyRegistrationReportBuilder;

function DailyRegistrationReportBuilder(max_days_back) {
    DailyReport.prototype.constructor.call(this, max_days_back);
}

DailyRegistrationReportBuilder.prototype.getTypesToProcess = function(from_moment, to_moment, callback2) {
    reports_database.registrations.distinct('type', {
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

DailyRegistrationReportBuilder.prototype.processReportType = function(type, from_moment, to_moment, callback2) {
    var handler = types[type];
    if(handler) {
        handler.build(type, from_moment, to_moment, callback2);
        return;
    }
    winston.error('unknown type ' + type + ' encountered in daily favorites report builder');
    callback2(null, []);
};

DailyRegistrationReportBuilder.prototype.queryResults = function(type, context, from_moment, to_moment, callback2) {
    /*
    var handler = types[type];
    if(handler) {
        handler.query(type, context, from_moment, to_moment, callback2);
        return;
    }
    winston.error('unknown type ' + type + ' encountered in daily messages query handler');
    callback2(null, []);
*/

    // these are global queries
    if(context.brands) {
        delete context.brands;
    }
    this.standardQuery(reports_database.registrations, type, context, from_moment, to_moment, callback2);
};

function _buildRegistrationsByPlatform(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var match = {
        $and: [
            { timestamp: {$gte: from_moment.valueOf()} },
            { timestamp: {$lt: to_moment.valueOf()} }
        ]
    };

    aggregation_util.aggregateOnField({
            audit_collection: audit_database.registrations,
            primary_property: 'platform',
            match: match,
            projected_property_name: 'platform'
        }, function(err_aggregate, aggregate_result) {
            if(err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            var to_write = _.indexBy(aggregate_result, 'platform');
            _.each(_.keys(to_write), function(key) {
                to_write[key] = to_write[key].count;
            });

            reports_database.registrations.insert({
                type: type,
                from_time: from_moment.valueOf(),
                to_time: to_moment.valueOf(),
                values: to_write
            }, function(err_insert) {
                callback2(err_insert, to_write);
            });
        }
    );
}

function _buildRegistrationsByPlatformAndAge(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'age_range',
        projected_name: 'age_range',
        audit_database: audit_database,
        audit_collection: audit_database.registrations,
        report_collection: reports_database.registrations,
        audit_property: 'platform',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'timestamp',
        timestamp_is_date: false,
        preserved_properties: []
    }, callback2);
}

function _buildRegistrationsByPlatformAndZip(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'address.zip',
        projected_name: 'zip',
        audit_database: audit_database,
        audit_collection: audit_database.registrations,
        report_collection: reports_database.registrations,
        audit_property: 'platform',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'timestamp',
        timestamp_is_date: false,
        preserved_properties: []
    }, callback2);
}

function _buildRegistrationsByPlatformAndState(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'address.state',
        projected_name: 'state',
        audit_database: audit_database,
        audit_collection: audit_database.registrations,
        report_collection: reports_database.registrations,
        audit_property: 'platform',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'timestamp',
        timestamp_is_date: false,
        preserved_properties: []
    }, callback2);
}

function _buildRegistrationsByPlatformAndGender(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'gender',
        projected_name: 'gender',
        audit_database: audit_database,
        audit_collection: audit_database.registrations,
        report_collection: reports_database.registrations,
        audit_property: 'platform',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'timestamp',
        timestamp_is_date: false,
        preserved_properties: []
    }, callback2);
}

module.exports = DailyRegistrationReportBuilder;