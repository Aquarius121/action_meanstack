var config = require('config');
var winston = require('winston');

var database = require('./../database');

var db = database.init(config['product_database'], _onConnected);

exports.ean = db.collection('ean');

exports.pod_brands = db.collection('brands');
exports.pod_brand_owners = db.collection('brand-owners');

exports.coupons = db.collection('coupons');
exports.files = db.collection('files');
exports.feedback = db.collection('feedback');

exports.db = db;

function _onConnected() {
    exports.ean.ensureIndex({brand: 1}, {background: true, unique: false}, function(err) {});
    exports.ean.ensureIndex({ean: 1}, {background: true, unique: true}, function(err) {});
    exports.ean.ensureIndex({ean: 1, name: 1}, {background: true, unique: true}, function(err_index) {}); // for ean OR name queries (TODO: I think this can be erased soon)
    exports.ean.ensureIndex({ean: 1, upc: 1}, {background: true, unique: false}, function(err_index) {}); // for ean OR upc queries

    //exports.pod_brands.ensureIndex({bsin: 1}, {background: true, unique: true}, function() {});
    //exports.pod_brand_owners.ensureIndex({code: 1}, {background: true, unique: true}, function() {});
    //exports.pod_brand_owners.ensureIndex({'brands.bsin': 1}, {background: true, unique: false}, function() {});

    exports.coupons.ensureIndex({ean: 1, type: 1}, {background: true, unique: false}, function() {});
    exports.feedback.ensureIndex({ean: 1}, {background: true, unique: false}, function() {});
    //exports.files.ensureIndex({type: 1}, {background: true, unique: false}, function() {});
}

