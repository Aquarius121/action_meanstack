var _ = require('underscore');
var async = require('async');
var winston = require('winston');

var general_util = require('./general-utils');
var database_product_info = require('../database/instances/product-info');

exports.improveProperties = _improveProperties;
exports.fillInProductCount = _fillInProductCount;
exports.fillInProductCounts = _fillInProductCounts;

// will improve the properties of a bunch of brands, then call callback2 upon completion
// if shallImproveExisting is not set, only brands without the last_update_time are processed
function _improveProperties(shallImproveExisting, batch_size, callback2) {
    database_product_info.pod_brands.find({last_update: {$exists: false}}).limit(batch_size).toArray(function(err_brands, brands) {
        if(err_brands != null) {
            winston.error('an error occurred while finding brands to improve: ' + err_brands);
            callback2(err_brands, brands);
            return;
        }

        // if all records have timestamps, find oldest timestamps
        if(brands == null || brands.length == 0) {
            if(!shallImproveExisting) {
                winston.info('stopped brand improvement task');
                callback2(null, []);
                return;
            }

            database_product_info.pod_brands.find().sort({last_update: 1}).limit(batch_size).toArray(function(err_oldest, brands_oldest) {
                if(err_oldest != null) {
                    callback2(err_oldest);
                    return;
                }

                _improvePropertiesForRecords(brands_oldest, callback2);
            });
            return;
        }

        _improvePropertiesForRecords(brands, callback2);
    });
}

// improves the properties for a batch of records
//
// internally, just calls _improveRemainingPropertiesForRecords then
// creates the necessary db update functions
function _improvePropertiesForRecords(records, callback2) {
    _improveRemainingPropertiesForRecords(records, [], function(err_improve, results) {
        var tasks = [];
        _.each(results, function(brand) {
            tasks.push(_generatePropertyUpdateFunction(brand));
        });

        async.series(tasks, function(err, results_async) {
            callback2(null, results_async);
        });
    });
}

// will modify (in memory) the records that are to be processed, in order to improve them
function _improveRemainingPropertiesForRecords(records_left, records_processed, callback2) {
    if(records_left.length == 0) {
        callback2(null, records_processed);
        return;
    }

    var brand = records_left.shift();
    brand.last_update = (new Date()).getTime();
    _fillInBrandOwnerFromBSIN(brand, function() { //err_brand, brand_result
        _fillInProductCount(brand, function() {
            records_processed.push(brand);
            _improveRemainingPropertiesForRecords(records_left, records_processed, callback2);
        });
    });
}

function _generatePropertyUpdateFunction(update_record) {
    return function(callback) {
        var set_value = {};
        if(update_record['brand_owner']) {
            set_value['brand_owner'] = update_record['brand_owner'];
        }
        if(update_record['product_count']) {
            set_value['product_count'] = update_record['product_count'];
        }
        set_value['last_update'] = update_record['last_update'];
        database_product_info.pod_brands.update({_id: update_record['_id']}, {$set: set_value}, function() { // err, docs_updated
            callback(null, update_record);
        });
    };
}

function _fillInProductCount(brand, callback) {
    database_product_info.ean.find({brand: brand._id.toHexString()}).count(function(err_count, count) {
        if(err_count) {
            callback(err_count);
            return;
        }

        if(count == null) {
            callback();
            return;
        }
        brand.product_count = count;
        callback();
    });
}

function _fillInBrandOwnerFromBSIN(brand, callback) {
    if(_.isUndefined(brand['brand_owner']) && !_.isUndefined(brand['bsin'])) {
        database_product_info.pod_brand_owners.findOne({brands: {$in: [brand.bsin]}}, function(err_owner, owner) {
            if(err_owner != null) {
                callback();
                return;
            }

            if(owner == null) {
                callback();
                return;
            }
            brand.brand_owner = owner._id.toHexString();
            callback();
        });

        return;
    }
    callback();
}

function _fillInProductCountMutator(brands, callback2) {

    var tasks = [];

    brands.forEach(function(brand) {
        tasks.push(function(callback) {

            _fillInProductCount(brand, function(err_count) {
                if(err_count) {
                    callback(err_count);
                    return;
                }

                // fill in this product's product count in the db
                database_product_info.pod_brands.update(
                    {
                        _id: brand._id
                    },
                    {
                        $set: {
                            product_count: brand.product_count,
                            batch_update_time: new Date()
                        }
                    }, function(err_update) {
                        if(err_update) {
                            callback(err_update);
                            return;
                        }
                        callback();
                    }
                );
            });
        });
    });

    async.series(tasks, function(err_async, async_result) {
        callback2(err_async, async_result);
    });
}

function _fillInProductCounts(callback2) {

    var query = {};

    var fields = {
        _id: 1
    };

    general_util.processMatchingCollectionItems(database_product_info.pod_brands, 100, query, fields, _fillInProductCountMutator, callback2);
}