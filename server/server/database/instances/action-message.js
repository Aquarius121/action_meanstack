var config = require('config');
var winston = require('winston');

var database = require('./../database');

var db = database.init(config['message_database'], _onConnected);

exports.user_messages = db.collection('user-messages');
exports.crm_messages = db.collection('crm-messages');
exports.crm_errors = db.collection('crm-errors');

exports.db = db;

function _onConnected() {
    exports.user_messages.ensureIndex({user_id: 1, state: 1}, {background: true, unique: false}, function(err) {});
    exports.crm_messages.ensureIndex({user_id: 1}, {background: true, unique: false}, function(err) {});
}
