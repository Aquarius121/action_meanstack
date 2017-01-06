var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var schedule = require('node-schedule');
var url = require('url');
var winston = require('winston');

var audit_database = require('../database/instances/action-audit');
var database = require('../database/instances/action');
var product_database = require('../database/instances/product-info');

var brand_util = require('../util/brand-utils');
var general_util = require('../util/general-utils');
var product_util = require('../util/product-utils');
var user_util = require('../util/user-utils');

module.exports = {
    opt_ins_view: _handleUserOptInsView,
    opt_ins_get: _handleUserOptInsGet,

    opt_in_add: _handleAddOptIns,
    opt_in_remove: _handleUserOptInRemove
};


function _handleUserOptInsView(req, res) {
    var caller = user_util.getCaller(req);

    user_util.getSafeUserById(database.user_account, caller, req.param('id'),
        function(err, code) {
            if(code == 404) {
                general_util.render404(req, res);
                return;
            }
            res.send(err, code);
        }, function(user) {
            res.render('user-opt-ins', {
                caller: caller,
                user: user_util.getSafeUser(user),
                title: 'Opt-ins',
                url: req.url
            });
        }
    );
}


function _handleAddOptIns(req, res) {
    var id = req.param('id');
    var brand_id = req.param('brand');
    var product_id = req.param('product');

    if(!_validateCanEditOptIns(req, res)) {
        return;
    }

    var brand, product;

    async.series([

        // load brand, confirm exists
        function(callback) {
            if(!brand_id) {
                callback();
                return;
            }

            product_database.pod_brands.findOne({_id: ObjectID(brand_id)}, function(err_brand, brand_result) {
                if(err_brand) {
                    callback('brand not found');
                    return;
                }
                brand = brand_result;
                callback();
            });
        },

        // load product, confirm exists
        function(callback) {
            if(!product_id) {
                callback();
                return;
            }

            product_database.ean.findOne({_id: ObjectID(product_id)}, function(err_product, product_result) {
                if(err_product) {
                    callback('brand not found');
                    return;
                }
                product = product_result;
                callback();
            });
        },

        // load user, make sure it exists, and brand/product isn't already opted into
        function (callback) {
            database.user_account.findOne({_id: ObjectID(id)}, {opt_ins: 1}, function(err_user, user) {
                if(err_user) {
                    callback(err_user);
                    return;
                }

                if(!user) {
                    general_util.send404(res);
                    return; // this short-circuits, as callback isn't called
                }

                if(!user.opt_ins) {
                    callback();
                    return;
                }

                var opted_brand = _.findWhere(user.opt_ins, {brand: brand_id});
                if(brand_id && opted_brand) {
                    brand = null; // don't process this brand - it's already there
                }

                var opted_product = _.findWhere(user.opt_ins, {product: product_id});
                if(product_id && opted_product) {
                    product = null; // don't process this product - it's already there
                }

                callback();
            });
        },

        // do the opting
        function(callback) {
            if(!id) {
                callback();
                return;
            }

            var opt_ins = [];

            if(brand) {
                opt_ins.push({
                    name: brand.name,
                    brand: brand_id
                });
            }

            if(product) {
                opt_ins.push({
                    name: product.name,
                    product: product_id,
                    brand: product.brand
                });
            }

            // we allow this because of the idempotence of PUT
            if(opt_ins.length == 0) {
                callback();
                return;
            }

            _reportOptIn(req, brand, product, true);

            database.user_account.update({_id: ObjectID(req.param('id'))},
                {
                    $push: {
                        opt_ins: { $each: opt_ins }
                    }
                }, function(err_opt) {
                if(err_opt) {
                    callback(err_opt, null);
                    return;
                }

                callback();
            });
        }

    ], function(err_async) { // , async_result
        if(err_async) {
            res.send(err_async, 500);
            return;
        }
        res.send({result: 'ok'}, 200);
    });
}


function _handleUserOptInRemove(req, res) {
    var id = req.param('id');
    var brand_id = req.param('brand');
    var product_id = req.param('product');

    if(!_validateCanEditOptIns(req, res)) {
        return;
    }

    var brand, product;

    async.series([

        // load brand, confirm exists
        function(callback) {
            product_database.pod_brands.findOne({_id: ObjectID(brand_id)}, function(err_brand, brand_result) {
                if(err_brand) {
                    callback('brand not found');
                    return;
                }
                brand = brand_result;
                callback();
            });
        },

        // load product, confirm exists
        function(callback) {
            product_database.ean.findOne({_id: ObjectID(product_id)}, function(err_product, product_result) {
                if(err_product) {
                    callback('brand not found');
                    return;
                }
                product = product_result;
                callback();
            });
        },

        // grab the user, validate user exists and product/brand is currently opted into
        function(callback) {
            database.user_account.findOne({_id: ObjectID(req.param('id'))}, function(err_opt, user) {
                if(err_opt) {
                    callback(err_opt, null);
                    return;
                }

                if(!user) {
                    callback('user not found', null);
                    return;
                }

                var opted_brand = _.findWhere(user.opt_ins, {brand: brand_id});
                if(brand_id && !opted_brand) {
                    callback('brand is not currently a opted into', null);
                    return;
                }

                var opted_product = _.findWhere(user.opt_ins, {product: product_id});
                if(product_id && !opted_product) {
                    callback('product is not currently opted into', null);
                    return;
                }

                callback();
            });
        },

        // do the proper updates
        function(callback) {
            _reportOptIn(req, brand, product, false);

            var pull_resources = [];

            if(brand_id) {
                pull_resources.push({brand: brand_id});
            }

            if(product_id) {
                pull_resources.push({product: product_id});
            }

            database.user_account.update({_id: ObjectID(req.param('id'))}, {$pull: {opt_ins: {$or: pull_resources}}}, function(err_delete, delete_result) {
                callback(err_delete, delete_result);
            });
        }

    ], function(err_async) { // , async_result
        if(err_async) {
            res.send(err_async, 500);
            return;
        }
        res.send({result: 'ok'}, 200);
    });
}

function _handleUserOptInsGet(req, res) {
    var caller = user_util.getCaller(req);

    var id = req.param('id');

    if(!id) {
        res.send('id must be supplied', 500);
        return;
    }

    if(!user_util.canEditUser(caller, req.param('id'))) {
        general_util.send404(res);
        return;
    }

    if(!general_util.isValidId(req.param('id'))) {
        res.send('invalid id for user', 500);
        return;
    }

    async.series({

        user: function(callback) {
            database.user_account.findOne({
                _id: ObjectID(id)
            }, function(err_opt_ins, user) {
                callback(err_opt_ins, user);
            });
        }

    }, function(err_opt_ins, prereqs) {
        if(err_opt_ins) {
            res.send(err_opt_ins, 500);
            return;
        }

        if(!prereqs.user) {
            res.send('user not found', 404);
            return;
        }

        var brand_ids = _.filter(_.pluck(prereqs.user.opt_ins, 'brand'), function(item) { return item; });
        var product_ids = _.filter(_.pluck(prereqs.user.opt_ins, 'product'), function(item) { return item; });

        var brands = [], products = [];

        async.series({

            brands: function(callback) {

                var fields = {_id: 1, name: 1, link: 1, logo_url: 1, privacy_policy_url: 1};
                brand_util.getBrandsByIds(brand_ids, fields, function(err, brand_results) {
                    if(err) {
                        res.send(err, 500);
                        return;
                    }
                    brands = _.map(brand_results, function(brand) {
                        brand._id = brand._id.toHexString();
                        return brand;
                    });
                    callback();
                });

            },

            products: function(callback) {

                var fields = { _id: 1, name: 1, ean: 1, brand: 1 };
                product_util.getProductsByIds(product_ids, null, function(err, product_results) {
                    if(err) {
                        res.send(err, 500);
                        return;
                    }
                    products = _.map(product_results, function(product) {
                        product._id = product._id.toHexString();
                        return product;
                    });
                    callback();
                });
            }

        }, function(err_async) {
            if(err_async) {
                res.send(err_async, 500);
                return;
            }

            res.send({
                products: products,
                brands: brands
            }, 200);
        });
    });
}

function _reportOptIn(req, brand, product, added) {

    if(brand) {
        audit_database.reportEvent('opt_in_brand', audit_database.generateAuditRecord(req, {
            'added':        added,
            'brand':        brand._id.toHexString(),
            'brand_name':   brand.name
        }));
    }

    if(product) {
        audit_database.reportEvent('opt_in_product', audit_database.generateAuditRecord(req, {
            'added':        added,
            'product':      product._id.toHexString(),
            'product_name': product.name
        }));
    }
}

function _validateCanEditOptIns(req, res) {
    var caller = user_util.getCaller(req);

    var id = req.param('id');
    var brand_id = req.param('brand');
    var product_id = req.param('product');

    // make sure an id that represents a user account has been provided (and the caller can edit the user)
    if(!id) {
        res.send('id must be supplied', 500);
        return false;
    }

    if(!user_util.canEditUser(caller, id)) {
        general_util.send404(res);
        return false;
    }

    if(!general_util.isValidId(id)) {
        res.send('invalid id for user', 500);
        return false;
    }

    // (brand || product) is required
    if(!brand_id && !product_id) {
        res.send('brand or product must be supplied', 500);
        return false;
    }

    // make sure an id that represents a brand has been provided
    if(brand_id) {
        if(!general_util.isValidId(brand_id)) {
            res.send('invalid id for brand', 500);
            return false;
        }
    }

    // make sure an id that represents a product has been provided
    if(product_id) {
        if(!general_util.isValidId(product_id)) {
            res.send('invalid id for product', 500);
            return false;
        }
    }

    return true;
}