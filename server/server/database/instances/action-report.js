var config = require('config');
var winston = require('winston');

var database = require('./../database');

var db = database.init(config['reports_database'], _onConnected);

exports.aggregation_temp = db.collection('aggregation-temp');
exports.favorites = db.collection('favorites');
exports.logins = db.collection('logins');
exports.messages = db.collection('messages');
exports.opt_ins = db.collection('opt-ins');
exports.page_ratings = db.collection('page-ratings');
exports.product_queries = db.collection('product-queries');
exports.registrations = db.collection('registrations');
exports.surveys = db.collection('surveys');
exports.unique_users = db.collection('unique-users');
exports.user_profile = db.collection('user-profile');
exports.where_to_buys = db.collection('where-to-buys');

exports.db = db;

function _onConnected() {
    exports.user_profile.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.surveys.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.favorites.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.registrations.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: true}, function(err) {});
    exports.where_to_buys.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.product_queries.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.logins.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.unique_users.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.messages.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.page_ratings.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
    exports.opt_ins.ensureIndex({type: 1, from_time: 1, to_time: 1}, {background: true, unique: false}, function(err) {});
}
