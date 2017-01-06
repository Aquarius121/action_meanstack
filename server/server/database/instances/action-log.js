var config = require('config');
var winston = require('winston');

var database = require('./../database');

var db = database.init(config['logging']['database'], _onConnected);

exports.logs = db.collection('logs');

exports.db = db;

function _onConnected() {
}
