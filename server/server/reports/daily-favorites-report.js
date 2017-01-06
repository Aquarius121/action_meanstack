var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var GenericReport = reports_module.GenericReport;
var aggregation_utils = reports_module.AggregationUtils;

var action_database = require('../database/instances/action');
var product_database = require('../database/instances/product-info');
var reports_database = require('../database/instances/action-report');

var types = {
    'favorite-brands-as-product-favorites': _handleBrandAsProductFavoritesTotal,
    'favorite-brand-totals': _handleFavoriteBrandTotals,
    'favorites-by-brand-and-age': _handleFavoritesByBrandAndAge,
    'favorites-by-brand-and-zip': _handleFavoritesByBrandAndZip,
    'favorites-by-brand-and-state': _handleFavoritesByBrandAndState,
    'favorites-by-brand-and-gender': _handleFavoritesByBrandAndGender
};

DailyFavoritesReportBuilder.prototype  = new GenericReport();
DailyFavoritesReportBuilder.prototype.constructor = DailyFavoritesReportBuilder;

function DailyFavoritesReportBuilder(max_days_back) {
    GenericReport.prototype.constructor.call(this, types, reports_database.favorites, GenericReport.units.DAYS, max_days_back);
}

// This somewhat simple report will just get the total favorites in the system for each brand
function _handleFavoriteBrandTotals(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var match = {
        $and: [
            {favorites: {$not: {$size: 0}}},
            {favorites: {$exists: true}}
        ]
    };

    aggregation_utils.aggregateOnField({
            audit_collection: action_database.user_account,
            primary_property: 'favorites.brand',            // aggregate on favorites.brand
            match: match,                                   // only include |favorites| > 0
            projected_property_name: 'brand',               // call favorites.brand "brand"
            unwind_property: 'favorites',                   // unwind favorites array into separate items
            pregroup_projection: {                          // turn certain undefined properties to null, preserve others
                _id: 1,
                'favorites.product': {$ifNull: ['$favorites.product', null]},
                'favorites.brand': {$ifNull: ['$favorites.brand', null]}
            },
            pregroup_match: {
                'favorites.product': null
            }
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                winston.error('while processing daily favorites report: ' + err_aggregate);
                callback2(err_aggregate);
                return;
            }

            _applyBrands(aggregate_result, function(err_results, results) {
                if(err_results) {
                    callback2(err_results);
                    return;
                }
                GenericReport.saveReport(reports_database.favorites, type, from_moment, to_moment, results, callback2);
            });
        }
    );
}

// this report will get the favorite brands, assessed by counting the product favorites for brands
// rather than the brand favorites themselves
function _handleBrandAsProductFavoritesTotal(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var match = {
        $and: [
            {favorites: {$not: {$size: 0}}},
            {favorites: {$exists: true}}
        ]
    };

    aggregation_utils.aggregateOnField({
            audit_collection: action_database.user_account,
            primary_property: 'favorites.brand',    // aggregate on favorites.brand
            match: match,                           // only include |favorites| > 0
            unwind_property: 'favorites',           // unwind favorites array into separate items
            projected_property_name: 'brand',
            pregroup_projection: {                  // map undefined to null for a few fields
                _id: 1,
                'favorites.product': {$ifNull: ['$favorites.product', null]},
                'favorites.brand': {$ifNull: ['$favorites.brand', null]}
            },
            pregroup_match: {                       // we only want to count product favorites, not brand favorites
                'favorites.product': {$ne: null}
            }
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                winston.error('while processing daily favorites report: ' + err_aggregate);
                callback2(err_aggregate);
                return;
            }

            _applyBrands(aggregate_result, function(err_results, results) {
                if(err_results) {
                    callback2(err_results);
                    return;
                }
                GenericReport.saveReport(reports_database.favorites, type, from_moment, to_moment, results, callback2);
            });
        }
    );
}

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

function _handleFavoritesByBrandAndAge(type, from_moment, to_moment, callback2) {
    _handleFavoritesByBrandAndProperty(type, from_moment, to_moment, 'age_range', '$age_range', callback2);
}

function _handleFavoritesByBrandAndZip(type, from_moment, to_moment, callback2) {
    _handleFavoritesByBrandAndProperty(type, from_moment, to_moment, 'zip', '$address.zip', callback2);
}

function _handleFavoritesByBrandAndState(type, from_moment, to_moment, callback2) {
    _handleFavoritesByBrandAndProperty(type, from_moment, to_moment, 'state', '$address.state', callback2);
}

function _handleFavoritesByBrandAndGender(type, from_moment, to_moment, callback2) {
    _handleFavoritesByBrandAndProperty(type, from_moment, to_moment, 'gender', '$gender', callback2);
}

function _handleFavoritesByBrandAndProperty(type, from_moment, to_moment, property, agg_property, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var property_push = {};
    property_push[property] = {};
    property_push[property]['$push'] = agg_property;

    var pregroup_projection = {
        _id: 1,
        'favorites.name': 1,
        'favorites.product': {$ifNull: ['$favorites.product', null]},
        'favorites.brand': {$ifNull: ['$favorites.brand', null]},
        'age_range': 1,
        'address': 1,
        'gender': 1
    };

    var aggregation_pipeline = [
        {
            $match: {
                $and: [
                    {favorites: {$not: {$size: 0}}},
                    {favorites: {$exists: true}}
                ]
            }
        },
        {
            $unwind: '$favorites'
        },
        {
            $project: pregroup_projection   // map undefined to null
        },
        {
            $match: {
                'favorites.product': {      // we only want product favorites
                    $ne: null
                }
            }
        },

        // count favorites by brand, prepare other attributes that are to be counted
        {
            $group : _.extend({
                _id : "$favorites.brand",
                count : {
                    $sum : {
                        $cond: {
                            if: {$ne: [ '$favorites.product', null ]},
                            then: 1,
                            else: 0
                        }
                    }
                }
            }, property_push)
        }
    ];

    aggregation_utils.buildAggregationByField([['brand', '$brand'], ['count', '$count']],
        property,
        aggregation_pipeline);

    // prepare for output
    var property_project = {};
    property_project[property] = 1;
    aggregation_pipeline.push({
        $project: _.extend({
            brand: '$_id',
            brand_name: 1,
            count: 1,
            _id: 0
        }, property_project)
    });

    action_database.user_account.aggregate(aggregation_pipeline,
        {
            //$limit: 10000,// top 10,000 enough?
            allowDiskUse: true
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                winston.error('while processing daily favorites report: ' + err_aggregate);
                callback2(err_aggregate);
                return;
            }

            _applyBrands(aggregate_result, function(err_results, results) {
                if(err_results) {
                    callback2(err_results);
                    return;
                }
                GenericReport.saveReport(reports_database.favorites, type, from_moment, to_moment, results, callback2);
            });
        }
    );
}

module.exports = DailyFavoritesReportBuilder;