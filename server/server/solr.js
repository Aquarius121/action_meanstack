var _ = require('underscore');
var config = require('config');
var solr = require('solr-client');
var schedule = require('node-schedule');
var winston = require('winston');

// module exports:
// -------------------
// exports.optimizeJob
// exports.client
// exports.product_client
// exports.generateProductRecord
// exports.optimize

_createSolrClients();
_scheduleOptimizes();

exports.optimize = _optimize;
exports.optimizeProducts = _optimizeProducts;
exports.deleteAll = _deleteAll;
exports.ping = _ping;

exports.generateProductRecord = function(product) {
    var product_record = {
        id: product._id.toHexString(),
        ean: product.ean,
        name: product.name,
        brand: product.brand_name
    };
    if(product.feature_weight) {
        product_record.feature_weight_i = product.feature_weight;
    }
    product_record.part = product.part;
    return product_record;
};

function _createSolrClients() {
    // Create "root" client
    var client = solr.createClient({host: config.solr.host, port: config.solr.port});
    client.basicAuth(config.solr.products.user, config.solr.products.password);

// Create a client for products
    var product_client = solr.createClient({host: config.solr.host, port: config.solr.port, core: 'products'});
    product_client.basicAuth(config.solr.products.user, config.solr.products.password);
    product_client.autoCommit = true; // Switch on "auto commit", by default `client.autoCommit = false`

    exports.product_client = product_client;
    exports.client = client;
}

function _scheduleOptimizes() {
    var rule = new schedule.RecurrenceRule();
    rule.hour = 2;

    exports.optimizeJob = schedule.scheduleJob(rule, function(){
        console.log('SOLR optimization complete!');
    });
}

function _optimize(client, callback2) {
    var options = {
        //waitFlush: false ,
        waitSearcher: true
    };
    client.optimize(options,function(err, obj){
        callback2(err, obj);
    });
}

function _deleteAll(client, callback2) {
    var query = "*:*";
    client.deleteByQuery(query, callback2);
    client.commit(); // TODO: does this get called in callback to deleteByQuery?
}

// TODO: is this the best spot for this method?
function _optimizeProducts(product_list, callback2) {
    var solr_documents = [];
    _.each(product_list, function(record) {
        solr_documents.push(exports.generateProductRecord(record));
    });
    exports.product_client.add(solr_documents, function(err) { // obj
        if(err) {
            winston.error('while optimizing SOLR product records: ' + err);
        }
        callback2(null, product_list);
    });
}

function _ping(callback2) {
    exports.product_client.ping(callback2);
}