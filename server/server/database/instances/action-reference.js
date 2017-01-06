var config = require('config');
var winston = require('winston');

var database = require('./../database');

var db = database.init(config['reference_database'], _onConnected);

exports.postal_code = db.collection('postal-code');

exports.db = db;

function _onConnected() {
    exports.postal_code.ensureIndex({location: "2d"}, {background: true, unique: false}, function(err) {
        if(err) {
            winston.error('failed to ensure 2d index for postal codes, err = ' + err);
        }
    });
}
