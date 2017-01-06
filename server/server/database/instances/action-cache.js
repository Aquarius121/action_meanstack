var config = require('config');
var winston = require('winston');

var database = require('./../database');

var db = database.init(config['cache_database'], _onConnected);

exports.wilke_documents = db.collection('wilke-documents');

exports.db = db;

function _onConnected() {
    exports.wilke_documents.ensureIndex({type: 1, query: 1}, {background: true, unique: true}, function(err) {});
}
