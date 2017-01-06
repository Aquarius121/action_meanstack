var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var database_product_info = require('../database/instances/product-info');

var solr = require('../solr');

var general_util = require('./general-utils');

module.exports = {
    addSolrIndices: _addSolrIndices,
    removeUnbranded: _removeUnbranded
};

// ===

function _removeUnbranded(callback2) {
    general_util.processMatchingCollectionItems(database_product_info.ean, 500, { brand: {$exists: false}}, {}, _removeUnbrandedBatchMutator, callback2);
}

function _addSolrIndices(query, callback2) {
    var fields = {
        _id: 1,
        ean: 1,
        name: 1,
        brand_name: 1,
        feature_weight: 1
    };
    var brands = Array();
    database_product_info.pod_brands.find({}).toArray(function(err,results){
        for(i=0; i<results.length; i++)
        {
            if(results[i]['participating'])
                brands[results[i]['name']] = 1;
            else
                brands[results[i]['name']] = 0;
        }
        general_util.processMatchingCollectionItems1(database_product_info.ean, brands , 2000, query, fields, _addProductsToSolrMutator, callback2);
    });

}

// TODO: this is stupid code, so just do a remove() at some point.  I left it for reference for update/delete partitions
// initially, I did this because I thought I'd be removing from SOLR as well.
// it's easier just to do a mass-update after a remove, really...
function _removeUnbrandedBatchMutator(products, callback2) {

    var update_ids = _.filter(products, function(product) {
        return !!product.brand;
    });
    update_ids = _.map(update_ids, function(product) { return product._id; });

    var delete_ids = _.filter(products, function(product) {
        return !product.brand;
    });

    delete_ids = _.map(delete_ids, function(product) { return product._id;});

    async.series({
        'update': function(callback) {
            database_product_info.ean.update({_id: {$in: update_ids}}, {$set: {batch_update_time: new Date()}}, {multi: true}, callback);
        },

        'delete': function(callback) {
            database_product_info.ean.remove({_id: {$in: delete_ids}}, {multi: true}, callback);
        }

    }, function(err_async, async_result) {
        callback2(err_async, async_result);
    });
}

function _addProductsToSolrMutator(records, callback2) {
    var update_ids = _.map(records, function(product) { return product._id; });

    async.series({

        'solr': function(callback) {
            solr.optimizeProducts(records, callback);
        },

        'update': function(callback) {
            database_product_info.ean.update({_id: {$in: update_ids}}, {$set: {batch_update_time: new Date()}}, {multi: true}, callback);
        }

    }, function(err_async, async_result) {
        callback2(err_async, async_result);
    });
}