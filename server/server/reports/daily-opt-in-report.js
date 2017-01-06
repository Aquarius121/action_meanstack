var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var GenericReport = reports_module.GenericReport;
var aggregation_util = reports_module.AggregationUtils;

var action_database = require('../database/instances/action');
var product_database = require('../database/instances/product-info');
var reports_database = require('../database/instances/action-report');

var types = {
    'opt-in-total':  _handleOptIns,
    'opt-in-totals-by-brand': _handleOptInsByBrand
};

DailyOptInReportBuilder.prototype  = new GenericReport();
DailyOptInReportBuilder.prototype.constructor = DailyOptInReportBuilder;

function DailyOptInReportBuilder(max_days_back) {
    GenericReport.prototype.constructor.call(this, types, reports_database.opt_ins, GenericReport.units.DAYS, max_days_back);
}

function _handleOptIns(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var aggregation_pipeline = [

        // count opt-ins by brand, prepare other attributes that are to be counted
        {
            $group : {
                _id : "1",
                count : {
                    $sum: {
                        $cond: {
                            if: {$eq: [ '$opt', true ]},
                            then: 1,
                            else: 0
                        }
                    }
                }
            }
        },
        {
            $project: {
                count: 1,
                _id: 0
            }
        }
    ];

    action_database.user_account.aggregate(aggregation_pipeline,
        {
            //$limit: 10000,// top 10,000 enough?
            allowDiskUse: true
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                winston.error('while processing daily opt-ins report: ' + err_aggregate);
                callback2(err_aggregate);
                return;
            }

            reports_database.opt_ins.insert({
                type: type,
                from_time: from_moment.valueOf(),
                to_time: to_moment.valueOf(),
                duration: to_moment.valueOf() - from_moment.valueOf(),
                count: aggregate_result.length > 0 ? aggregate_result[0].count : 0
            }, function(err_insert) {
                callback2(err_insert, aggregate_result);
            });
        }
    );
}

function _handleOptInsByBrand(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var match = {
        $and: [
            {opt_ins: {$not: {$size: 0}}},
            {opt_ins: {$exists: true}}
        ]
    };

    aggregation_util.aggregateOnField({
        audit_collection: action_database.user_account,
        primary_property: 'opt_ins.brand',
        match: match,
        projected_property_name: 'brand',               // call opt_ins.brand "brand"
        unwind_property: 'opt_ins',
        pregroup_projection: {                          // turn certain undefined properties to null, preserve others
            _id: 1,
            'opt_ins.product': {$ifNull: ['$opt_ins.product', null]},
            'opt_ins.brand': {$ifNull: ['$opt_ins.brand', null]}
        },
        pregroup_match: {                               // we only want brand opt-ins
            'opt_ins.product': null,
            'opt_ins.brand': {$ne: null}
        }
    }, function(err_aggregate, aggregate_result) {
        if(err_aggregate) {
            winston.error('failed to aggregate ' + type + ': ' + err_aggregate);
            callback2(err_aggregate);
            return;
        }

        _applyBrands(aggregate_result, function(err_results, results) {
            if(err_results) {
                callback2(err_results);
                return;
            }
            GenericReport.saveReport(reports_database.opt_ins, type, from_moment, to_moment, results, callback2);
        });
    });
}

// given a set of results, fill in brand properties with latest from database
function _applyBrands(results, callback2) {

    // get the name for each brand in the results
    var brand_ids = _.pluck(results, 'brand');
    var brands_ids_oid = _.map(brand_ids, function(brand_id) {
        return ObjectID(brand_id);
    });

    product_database.pod_brands.find({
        _id: {$in: brands_ids_oid}
    }, {
        _id: 1,
        name: 1
    }).toArray(function(err_brands, brands) {
        if(err_brands) {
            callback2(err_brands);
            return;
        }

        // apply the brand names to the aggregation results
        brands = _.map(brands, function (brand) {
            brand._id = brand._id.toHexString();
            return brand;
        });

        var matching_brand;
        _.each(results, function (result) {
            matching_brand = _.findWhere(brands, {_id: result.brand});
            if(matching_brand != null && typeof matching_brand != undefined)
                result.name = matching_brand.name;
        });

        callback2(null, results);
    });
}

module.exports = DailyOptInReportBuilder;