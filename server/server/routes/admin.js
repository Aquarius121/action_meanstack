var _ = require('underscore');
var async = require('async');
var backup_manager = require('node-mongo-backup-manager');
var config = require('config');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var node_server_monitor = require('node-server-monitor');
var database_monitor = node_server_monitor.mongo_database_monitor;

var action_database = require('../database/instances/action');
var audit_database = require('../database/instances/action-audit');
var cache_database = require('../database/instances/action-cache');
var database = require('../database/database');
var feedback_database = require('../database/instances/action-feedback');
var message_database = require('../database/instances/action-message');
var reference_database = require('../database/instances/action-reference');
var report_database = require('../database/instances/action-report');
var product_database = require('../database/instances/product-info');

var brand_improve = require('../util/brand-improve');
var general_util = require('../util/general-utils');
var product_improve = require('../util/product-improve');
var reports_manager = require('reports-using-mongo').ReportsManager;
var server = require('../server');
var user_util = require('../util/user-utils');

var solr = require('../solr');

module.exports = {
    admin_products: _handleAdminProducts,
    admin_brands: _handleAdminBrands,
    admin_reports: _handleAdminReports,
    admin_user: _handleAdminUser,
    admin_database: _handleAdminDatabase,
    admin_collection: _handleAdminCollection,
    admin_clear_data: _handleAdminClearData
};

function _handleAdminProducts(req, res) {
    var action = req.param('action');
    if(!action || action.trim().length == 0) {
        res.send('action must be defined', 500);
        return;
    }

    if(action == 'remove-unbranded') {
        _removeUnbrandedProducts(req, res);
        return;
    }
    if(action == 'rebuild-indices') {
        _rebuildSOLRIndices(req, res);
        return;
    }
    if(action == 'optimize-solr') {
        general_util.runInBackground(function() {
            solr.optimize(solr.product_client, function(err){ //,obj
                if(err) {
                    winston.error('an error occurred while optimizing SOLR indices: ' + err);
                    return;
                }
                winston.info('successfully optimized SOLR indices');
            });
        });
        res.send({result: 'began'}, 200);
        return;
    }
    res.send('unrecognized action', 500);
}

function _handleAdminBrands(req, res) {
    var action = req.param('action');
    if(!action || action.trim().length == 0) {
        res.send('action must be defined', 500);
        return;
    }

    if(action == 'recompute-product-counts') {
        _recomputeBrandProductCounts(req, res);
        return;
    }
    res.send('unrecognized action', 500);
}

function _handleAdminReports(req, res) {
    var action = req.param('action');
    if(!action || action.trim().length == 0) {
        res.send('action must be defined', 500);
        return;
    }

    if(action == 'process') {
        _processReports(req, res);
        return;
    }
    res.send('unrecognized action', 500);
}

function _handleAdminUser(req, res) {
    var action = req.param('action');

    if(action == 'become') {
        var caller = user_util.getCaller(req);

        var id = req.param('id');
        if(!general_util.isValidId(id)) {
            res.send('invalid id');
            return;
        }

        user_util.getSafeUserById(action_database.user_account, caller, id, function(err_user) {
                winston.error('sign-in failed for user with id=' + id);
                res.send(err_user, 500);
            },function(user_data) {
                if(!user_data) {
                    res.send('user not found', 404);
                    return;
                }

                // don't allow action-admins to become admins
                if(user_data.role == 'admin' && caller.role != 'admin') {
                    res.send('cannot become an admin user', 500);
                    return;
                }

                user_util.setCaller(req, user_data);
                //res.cookie('user', user_data.user, { maxAge: config.site.maxCookieAge });
                //res.cookie('pass', user_data.pass, { maxAge: config.site.maxCookieAge });
                //req.session.save();
                winston.debug('assume id processed for email=' + user_data.email);
                res.send({result: 'ok'}, 200);
            }
        );
        return;
    }

    if(action == 'surveys-clear') {
        action_database.user_account.update({}, {$unset: {resolved_survey: 1}}, {multi: true}, function(err_resolved) {
            if(err_resolved) {
                res.send(err_resolved, 500);
                return;
            }
            res.send({result: 'ok'}, 200);
        });
        return;
    }

    if(action == 'calculate-ages') {
        user_util.recalculateAges();
        res.send({result: 'ok'}, 200);
        return;
    }

    res.send('unknown action', 500);
}

function _getDbByName(db_name) {
    var db = null;

    switch(db_name) {
        case 'action':
            db = action_database;
            break;
        case 'action-audit':
            db = audit_database;
            break;
        case 'action-cache':
            db = cache_database;
            break;
        case 'action-feedback':
            db = feedback_database;
            break;
        case 'action-message':
            db = message_database;
            break;
        case 'action-reference':
            db = reference_database;
            break;
        case 'action-report':
            db = report_database;
            break;
        case 'product-info':
            db = product_database;
            break;
    }

    return db;
}

function _handleAdminDatabase(req, res) {
    var action = req.param('action', null);
    if(!action) {
        res.send('an action must be specified', 500);
        return;
    }

    if(action == 'repair') {

        var db = _getDbByName(req.param('db'));
        if(!db) {
            res.send('db not recognized', 500);
            return;
        }

        // compact in background - it could take a long time
        general_util.runInBackground(function() {
            database.repair(db, function(err_compact) {
                if(err_compact) {
                    winston.error('an error occurred while compacting collection: ' + err_compact);
                    return;
                }
                database_monitor.takeStats();
            });
        });

        // fire off a 200
        res.send({result: 'ok'}, 200);
        return;
    }

    if(action == 'backup') {
        winston.info('began database backup job');

        backup_manager.backup({
            username: config['storage'].user,      // TODO: only backs up database instance dynamic lives inside of
            password: config['storage'].password,
            outputDirectory: config["database_backups"]['backup_directory'],
            createEnclosingDirectory: true,
            compresses: true
        }, function(err_backup) {
            if(err_backup) {
                winston.error('while backing up database: ' + err_backup);
            }

            winston.info('finished database backup job');
        });

        // fire off a 200
        res.send({result: 'ok'}, 200);
        return;
    }

    res.send('unknown action', 500);
}

function _handleAdminCollection(req, res) {
    var db = _getDbByName(req.param('db'));
    if(!db) {
        res.send('db not recognized', 500);
        return;
    }

    var action = req.param('action', null);
    if(!action) {
        res.send('an action must be specified', 500);
        return;
    }

    if(action == 'compact') {
        general_util.runInBackground(function() {
            database.compact(db, req.param('collection'), function(err_compact) {
                if(err_compact) {
                    winston.error('an error occurred while compacting collection: ' + err_compact);
                    return;
                }
                database_monitor.takeStats();
            });
        });
        res.send({result: 'ok'}, 200);

        return;
    }

    res.send('unknown action', 500);
}

function _handleAdminClearData(req, res) {
    general_util.runInBackground(function() {

        var async_tasks = [];

        database_monitor.databases.forEach(function(db_module) {
            async_tasks.push(function(callback) {
                _clearDatabase(db_module, function(err_clear) {
                    callback(err_clear);
                });
            });
        });

        async.series(async_tasks, function(err_async) {
            if(err_async) {
                winston.error('could not delete all data: ' + err_async);
                return;
            }
            server.shutdown();
        });
    });
    res.send({result: 'began'}, 200);
}

function _clearDatabase(db_module, callback2) {
    winston.info('deleting contents of collections in database ' + db_module.db.databaseName);

    db_module.db.collections(function(err_collections, collections) {
        if(err_collections) {
            winston.error('could not get collections: ' + err_collections);
            return;
        }

        var async_tasks = [];

        collections.forEach(function(collection) {
            if(collection.collectionName.indexOf('system.') == -1) {
                async_tasks.push(function(callback) {
                    collection.remove({}, function(err_remove) {
                        callback(err_remove);
                    });
                });
            }
        });

        async.series(async_tasks, function(err_async) {
            winston.info('deleted contents of collections in database ' + db_module.db.databaseName);
            callback2(err_async);
        });
    });
}

function _removeUnbrandedProducts(req, res) {
    general_util.runInBackground(function() {
        product_improve.removeUnbranded(function() { // err_remove, remove_result
            winston.info('finished removing unbranded products');
        });
    });
    res.send({result: 'began'}, 200);
}

function _processReports(req, res) {
    general_util.runInBackground(function() {
        reports_manager.process();
    });
    res.send({result: 'began'}, 200);
}

function _rebuildSOLRIndices(req, res) {
    solr.deleteAll(solr.product_client, function(solr_response) {
        product_improve.addSolrIndices({}, function() {
            winston.info('added solr indices for all products');
        });
    });
    res.send({result: 'began'}, 200);
}

function _recomputeBrandProductCounts(req, res) {
    general_util.runInBackground(function() {
        brand_improve.fillInProductCounts(function() { // err_remove, remove_result
            winston.info('finished recomputing brand product counts');
        });
    });
    res.send({result: 'began'}, 200);
}