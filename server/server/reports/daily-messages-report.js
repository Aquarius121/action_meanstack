var _ = require('underscore');
var async = require('async');
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var DailyReport = reports_module.DailyReport;
var aggregation_util = reports_module.AggregationUtils;
var user_aggregation_util = require('../util/user-aggregation-utils');

// TODO: we should be using audit database, but we need to aggregate "resolved" which isn't stored there
var message_database = require('../database/instances/action-message');
var reports_database = require('../database/instances/action-report');

var types = {
    'messages-by-brand': {
        build: _buildMessagesByBrand
    }
    , 'messages-by-brand-and-type': {
        build: _buildMessagesByBrandAndType
    }
    , 'messages-by-brand-and-zip': {
        build: _buildMessagesByBrandAndZip
    }
    , 'messages-by-brand-and-state': {
        build: _buildMessagesByBrandAndState
    }
    , 'messages-by-brand-and-age': {
        build: _buildMessagesByBrandAndAge
    }
    , 'messages-by-brand-and-gender': {
        build: _buildMessagesByBrandAndGender
    }
    , 'messages-by-type': {
        build: _buildMessagesByType,
        query: _queryMessagesByType
    }

    /*
    , 'messages-by-type-and-age': {
        build: _buildMessagesByTypeAndAge,
        query: _queryMessagesByType
    }
    */

    , 'messages-by-product': {
        build: _buildMessagesByProduct,
        query: _queryMessagesByType
    }
    , 'messages-by-product-and-age': {
        build: _buildMessagesByProductAndAge,
        query: _queryMessagesByType
    }
    , 'messages-by-product-and-state': {
        build: _buildMessagesByProductAndState,
        query: _queryMessagesByType
    }
    , 'messages-by-product-and-zip': {
        build: _buildMessagesByProductAndZip,
        query: _queryMessagesByType
    }
    , 'messages-by-product-and-gender': {
        build: _buildMessagesByProductAndGender,
        query: _queryMessagesByType
    }
};

DailyMessagesReportBuilder.prototype  = new DailyReport();
DailyMessagesReportBuilder.prototype.constructor = DailyMessagesReportBuilder;

function DailyMessagesReportBuilder(max_days_back) {
    DailyReport.prototype.constructor.call(this, max_days_back);
}

DailyMessagesReportBuilder.prototype.getTypesToProcess = function(from_moment, to_moment, callback2) {
    reports_database.messages.distinct('type', {
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

DailyMessagesReportBuilder.prototype.processReportType = function(type, from_moment, to_moment, callback2) {
    var handler = types[type];
    if(handler) {
        handler.build(type, from_moment, to_moment, callback2);
        return;
    }
    winston.error('unknown type ' + type + ' encountered in daily messages report builder');
    callback2(null, []);
};

DailyMessagesReportBuilder.prototype.queryResults = function(type, context, from_moment, to_moment, callback2) {
    /*
    var handler = types[type];
    if(handler) {
        handler.query(type, context, from_moment, to_moment, callback2);
        return;
    }
    winston.error('unknown type ' + type + ' encountered in daily messages query handler');
    callback2(null, []);
*/

    this.standardQuery(reports_database.messages, type, context, from_moment, to_moment, callback2);
};

function _buildMessagesByBrand(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var pipeline = [
        {
            $match: {
                $and: [
                    { created: {$gte: new Date(from_moment.valueOf())} },
                    { created: {$lt: new Date(to_moment.valueOf())} }
                ]
            }
        },
        {
            $group : {
                _id : "$brand",
                name: {
                    $last: '$brand_name'
                },
                count : {
                    $sum : 1
                },
                resolved: {
                    $sum: {
                        $cond: {
                            if: {$eq: [ 'resolved', true ]},
                            then: 1,
                            else: 0
                        }
                    }
                },
                resolved_on_first: {
                    $sum: {
                        $cond: {

                            // if the "resolved" tag was set after the last update and there's at most CRM response
                            if: {
                                $and: [
                                    {$gt: ['$resolved_at', '$last_updated']},
                                    {$lte: ['$responses_count', 1]}
                                ]
                            },
                            then: 1,
                            else: 0
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                brand: '$_id',
                name: 1,
                count: 1,
                resolved: 1,
                resolved_on_first: 1
            }
        }
    ];

    message_database.user_messages.aggregate(pipeline,
        {
            $limit: 10000, // are the top 10,000 brands enough?
            allowDiskUse: true
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            reports_database.messages.insert({
                type: type,
                from_time: from_moment.valueOf(),
                to_time: to_moment.valueOf(),
                values: aggregate_result
            }, function(err_insert) {
                callback2(err_insert, aggregate_result);
            });
        }
    );
}

function _buildMessagesByProduct(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var pipeline = [
        {
            $match: {
                $and: [
                    { created: {$gte: new Date(from_moment.valueOf())} },
                    { created: {$lt: new Date(to_moment.valueOf())} }
                ]
            }
        },
        {
            $group : {
                _id : "$ean",
                product_name: {
                    $last: '$product_name'
                },
                brand: {
                    $last: '$brand'
                },
                brand_name: {
                    $last: '$brand_name'
                },
                count : {
                    $sum : 1
                },
                resolved: {
                    $sum: {
                        $cond: {
                            if: {$eq: [ '$resolved', true ]},
                            then: 1,
                            else: 0
                        }
                    }
                },
                resolved_on_first: {
                    $sum: {
                        $cond: {

                            // if the "resolved" tag was set after the last update and there's at most CRM response
                            if: {
                                $and: [
                                    {$gt: ['$resolved_at', '$last_updated']},
                                    {$lte: ['$responses_count', 1]}
                                ]
                            },
                            then: 1,
                            else: 0
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                ean: '$_id',
                name: '$product_name',
                brand: 1,
                brand_name: 1,
                count: 1,
                resolved: 1,
                resolved_on_first: 1
            }
        }
    ];

    message_database.user_messages.aggregate(pipeline,
        {
            $limit: 20000, // are the top 20,000 products enough? We just need to keep it under 16 MB
            allowDiskUse: true
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            reports_database.messages.insert({
                type: type,
                from_time: from_moment.valueOf(),
                to_time: to_moment.valueOf(),
                values: aggregate_result
            }, function(err_insert) {
                callback2(err_insert, aggregate_result);
            });
        }
    );
}

function _buildMessagesByBrandAndType(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var match = {
        $and: [
            { created: {$gte: new Date(from_moment.valueOf())} },
            { created: {$lt: new Date(to_moment.valueOf())} }
        ]
    };

    aggregation_util.aggregateOnTwoFields({
        audit_collection: message_database.user_messages,
        primary_property: ['brand', 'brand'],
        secondary_property: ['type', 'type'],
        match: match,
        preserved_properties: [['brand_name', 'brand_name']]
    }, function(err_aggregate, aggregate_result) {
        if(err_aggregate) {
            winston.error('failed to aggregate ' + type + ': ' + err_aggregate);
            callback2(err_aggregate);
            return;
        }

        reports_database.messages.insert({
            type: type,
            from_time: from_moment.valueOf(),
            to_time: to_moment.valueOf(),
            values: aggregate_result
        }, function(err_insert) {
            callback2(err_insert, aggregate_result);
        });
    });
}

function _buildMessagesByType(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var match = {
        $and: [
            { created: {$gte: new Date(from_moment.valueOf())} },
            { created: {$lt: new Date(to_moment.valueOf())} }
        ]
    };

    aggregation_util.aggregateOnField({
        audit_collection: message_database.user_messages,
        primary_property: 'type',
        match: match,
        projected_property_name: 'type'
    }, function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                winston.error('failed to aggregate ' + type + ': ' + err_aggregate);
                callback2(err_aggregate);
                return;
            }

            reports_database.messages.insert({
                type: type,
                from_time: from_moment.valueOf(),
                to_time: to_moment.valueOf(),
                values: aggregate_result
            }, function(err_insert) {
                callback2(err_insert, aggregate_result);
            });
        }
    );
}

function _buildMessagesByTypeAndAge(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'age_range',
        projected_name: 'age_range',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'type',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true
    }, callback2);
}

function _buildMessagesByProductAndAge(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'age_range',
        projected_name: 'age_range',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'ean',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true,
        preserved_properties: ['brand', 'brand_name', 'product_name']
    }, callback2);
}

function _buildMessagesByProductAndState(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'address.state',
        projected_name: 'state',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'ean',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true,
        preserved_properties: ['brand', 'brand_name', 'product_name']
    }, callback2);
}

function _buildMessagesByProductAndZip(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'address.zip',
        projected_name: 'zip',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'ean',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true,
        preserved_properties: ['brand', 'brand_name', 'product_name']
    }, callback2);
}

function _buildMessagesByProductAndGender(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'gender',
        projected_name: 'gender',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'ean',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true,
        preserved_properties: ['brand', 'brand_name', 'product_name']
    }, callback2);
}

function _buildMessagesByBrandAndAge(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'age_range',
        projected_name: 'age_range',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'brand',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true,
        preserved_properties: ['brand_name']
    }, callback2);
}

function _buildMessagesByBrandAndGender(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'gender',
        projected_name: 'gender',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'brand',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true,
        preserved_properties: ['brand_name']
    }, callback2);
}

function _buildMessagesByBrandAndZip(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'address.zip',
        projected_name: 'zip',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'brand',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true,
        preserved_properties: ['brand_name']
    }, callback2);
}

function _buildMessagesByBrandAndState(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily ' + type + ' report for ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    user_aggregation_util.aggregateOnPropertyAndUsers(type, from_moment, to_moment, {
        user_property: 'address.state',
        projected_name: 'state',
        audit_database: message_database,
        audit_collection: message_database.user_messages,
        report_collection: reports_database.messages,
        audit_property: 'brand',
        audit_record_user_id_property: 'user_id',
        timestamp_property: 'created',
        timestamp_is_date: true,
        preserved_properties: ['brand_name']
    }, callback2);
}

function _queryMessagesByType(type, context, from_moment, to_moment, callback2) {
    callback2(null, []);
}

module.exports = DailyMessagesReportBuilder;