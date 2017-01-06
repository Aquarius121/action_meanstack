var config = require('config');
var winston = require('winston');

var database = require('./../database');

var db = database.init(config['storage'], _onConnected);

exports.user_account = db.collection('user-account');
exports.site_config = db.collection('site-configuration');

exports.db = db;

exports.saveConfig = _saveConfig;
exports.getConfig = _getConfig;

function _onConnected() {

    // ensure admin user exists (designed for bootstrapping
    exports.user_account.findOne({email: 'admin@example.com'}, function(err_admin, admin) {
        if(err_admin) {
            winston.error('could not query admin user');
            return;
        }

        if(admin) {
            return;
        }

        exports.user_account.insert({
            "address" : {
                "street" : "3",
                "city" : "4",
                "state" : "5",
                "zip" : "27312"
            },
            "date_of_birth": "01/01/1969",
            "age_range" : "5",
            "email" : "admin@example.com",
            "favorites" : [
            ],
            "opt_ins": [
            ],
            "first_name" : "admin",
            "last_name" : "admin",
            "managed_brands" : [],
            "name" : "Admin",
            "password" : "h8Nc8XaUwSab4f82357979829f0cfab25c6e4df276",
            "phone" : "2",
            "role" : "admin",
            "opt" : false,
            "gender" : "2",
            "content" : [
            ]
        }, function(err_insert) {
            if(err_insert) {
                winston.error('failed to bootstrap admin user: ' + err_insert);
                return;
            }
            winston.info('bootstrapped default admin user');
        });
    });
}

var type_to_value_cache = {};

function _saveConfig(type, value, callback2) {
    var config_item = {
        key: type,
        value: value
    };

    exports.site_config.insert(config_item, function(err_insert) {
        if(err_insert) {
            callback2(err_insert);
            return;
        }

        type_to_value_cache[type] = config_item;
        callback2();
    });
}

function _getConfig(type, callback2) {
    var from_cache = type_to_value_cache[type];
    if(from_cache) {
        callback2(null, from_cache);
        return;
    }

    exports.site_config.findOne({key: type}, {sort: [['_id', -1]]}, function(err_config, config_item) {
        if(err_config) {
            callback2(err_config);
            return;
        }

        if(!config_item) {
            callback2(null, null);
            return;
        }

        type_to_value_cache[type] = config_item;
        callback2(null, config_item);
    });
}
