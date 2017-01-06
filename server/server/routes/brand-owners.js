var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var url = require('url');
var winston = require('winston');

var database = require('../database/instances/product-info');
var general_util = require('../util/general-utils');
var user_util = require('../util/user-utils');

var result_limit = 100;

module.exports = {
    brand_owner_view: _brandOwnerView,
    brand_owners_view: _brandOwnersView,
    brand_owner_create_view: _brandOwnerCreateView,

    brand_owners_query: _brandOwnersQuery,

    brand_owner_create: _brandOwnerCreate,
    brand_owner_update: _brandOwnerUpdate,
    brand_owner_delete: _brandOwnerDelete
};

function _brandOwnerView(req, res) {
    var caller = user_util.getCaller(req);

    if(!general_util.isValidId(req.param('id'))) {
        res.send('invalid id', 500);
        return;
    }

    database.pod_brand_owners.findOne({_id: ObjectID(req.param('id'))}, function(err_brand_owner, brand_owner) {
        if(err_brand_owner != null) {
            res.send(err_brand_owner, 500);
            return;
        }
        if(brand_owner == null) {
            general_util.render404(req, res);
            return;
        }
        res.render('brand-owner', {
            caller: caller,
            title: 'Brand Owner',
            owner: brand_owner,
            url: req.url
        });
    });
}

function _brandOwnersView(req, res) {
    var caller = JSON.parse(req.session['passport'].user);
    res.render('brand-owners', {
        caller: caller,
        title: 'Brand Owners',
        url: req.url
    });
}

function _brandOwnersQuery(req, res) {
    var query = {}, sort_by = {}, options = {};

    general_util.buildTableQuery(req.query.sort, req.query.filter, null, query, sort_by, []);

    database.pod_brand_owners.find(query, options).sort(sort_by).limit(result_limit).toArray(function(err, data) {
        if(err != null) {
            res.send('An error occurred: ' + err, 500);
            return;
        }

        if(data == null) {
            res.send({rows: [], total_records: 0}, 200);
            return;
        }

        var results = general_util.getPage(data, req.query['page'], req.query['pageSize']);
        res.send({rows: results, total_records: data.length}, 200);
    });
}

function _brandOwnerCreateView(req, res) {
    var caller = user_util.getCaller(req);
    res.render('brand-owner-create', {
        caller: caller,
        title: 'Create Brand Owner',
        url: req.url
    });
}

function _brandOwnerCreate(req, res) {

    // check name filled
    if(_.isUndefined(req.param('name')) || req.param('name').length == 0) {
        res.send('please provide a name', 500);
        return;
    }

    // TODO: link, wiki

    // TODO: check no conflict for name

    var brand_owner_info = {
        name: req.param('name'),
        brands: [],
        last_update: (new Date()).getTime()
    };

    database.pod_brand_owners.insert(brand_owner_info, function(err_insert, insert_result) {
        if(err_insert != null) {
            res.send(err_insert, 500);
            return;
        }
        res.send(insert_result, 200);
    });
}

function _brandOwnerUpdate(req, res) {
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    var optional_keys = [
        "name",
        "link"
    ];

    var unsets = {}, sets = {};

    // unset any optional key that isn't in the request, set any that are
    _.each(optional_keys, function(key) {
        if(_.isUndefined(req.body[key]) || (req.body[key]).length == 0) {
            unsets[key] = 1;
        } else {
            sets[key] = req.body[key];
        }
    });

    //"last_update" : NumberLong(1392657136335)
    var update_value = {};
    if(_.keys(sets).length > 0) {
        update_value['$set'] = sets;
    }
    if(_.keys(unsets).length > 0) {
        update_value['$unset'] = unsets;
    }

    if(_.keys(update_value).length == 0) {
        res.send('no update value provided', 500);
        return;
    }

    database.pod_brand_owners.update({_id: ObjectID(req.param('id'))}, update_value, function(err_update, update_result) {
        if(err_update != null) {
            res.send(err_update, 500);
            return;
        }
        res.send(update_result, 200);
    });
}

function _brandOwnerDelete(req, res) {
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    async.series([

        // remove brands from brand owner
        function(callback) {
            database.ean.update(
                { // query
                    brand_owner: id
                },
                { // update
                    $unset: {
                        brand_owner: 1
                    }
                },
                {  // options
                    multi: 1
                }, callback);
        },

        // delete brand owner
        function(callback) {
            database.pod_brand_owners.remove({_id: ObjectID(id)}, callback);
        }

    ], function(err_async, async_results) {
        if(err_async) {
            res.send(err_async, 500);
            return;
        }
        res.send(async_results, 200);
    });
}