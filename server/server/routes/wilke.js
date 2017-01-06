var _ = require('underscore');
var async = require('async');
var request = require('request');
var winston = require('winston');

var brand_util = require('../util/brand-utils');
var general_util = require('../util/general-utils');
var user_util = require('../util/user-utils');

var audit_database = require('../database/instances/action-audit');
var wilke = require('../util/wilke-utils');

module.exports = {
    list_categories: _handleListCategories,
    get_category: _handleGetCategory,
    get_document: _handleGetDocument
};

function _handleListCategories(req, res) {
    var caller = user_util.getCaller(req);
    var tenant = req.param('tenant');
    var ip = general_util.getIPAddress(req);

    var view_id = req.param('view');
    var docType = req.param('doctype');
    var brand = req.param('brand');
    var category = req.param('category');

    if(!view_id) {
        res.send('view is a required parameter', 500);
        return;
    }

    if(!docType) {
        res.send('doctype is a required parameter', 500);
        return;
    }

    async.series({

        'brand': function(callback) {
            if(!brand) {
                callback();
                return;
            }

            brand_util.getBrandData(caller, brand, function(err_brand, brand_result) {
                brand = brand_result;
                callback();
            });
        }

    }, function(err_async, async_result) {

        if(brand && brand.faq && brand.faq.wilke && brand.faq.wilke.brand_keyword) {
            category = brand.faq.wilke.brand_keyword;
        }

        wilke.searchEnlight({
            caller: caller,
            tenant: tenant,
            docType: docType,
            view: view_id,
            q2: category,
            ip: ip,
            callback2: function(err_categories, categories) {
                if (err_categories) {
                    res.send(err_categories, 500);
                    return;
                }
                res.send(categories, 200);
            }
        });
    });
}

function _handleGetCategory(req, res) {
    var caller = user_util.getCaller(req);
    var tenant = req.param('tenant');
    var category = req.param('category');
    var doctype = req.param('doctype'); // brand category doctype
    var view_id = req.param('view');
    var brand_keyword = req.param('brand_keyword');

    var ip = general_util.getIPAddress(req);

    if(!view_id) {
        res.send('view is a required parameter', 500);
        return;
    }

    if(!doctype) {
        res.send('doctype is a required parameter', 500);
        return;
    }

    wilke.searchEnlight({
        caller: caller,
        tenant: tenant,
        doctype: doctype,
        view: view_id,
        q2: brand_keyword,
        q3: category,
        ip: ip,
        callback2: function (err_category, category_result) {
            if (err_category) {
                res.send(err_category, 500);
                return;
            }
            category_result.rows = category_result.rows.filter(function(result) {
                return result.kbDocType && (result.kbDocType == 'ActionAppFAQ' || result.kbDocType == 'Q&A');
            });
            res.send(category_result, 200);
        }
    });
}

function _handleGetDocument(req, res) {
    var caller = user_util.getCaller(req);
    var tenant = req.param('tenant');
    var document_id = req.param('document');
    var view_id = req.param('view');

    if(!view_id) {
        res.send('view is a required parameter', 500);
        return;
    }

    var ip = general_util.getIPAddress(req);

    wilke.getEnlightDocument(caller, tenant, document_id, view_id, ip, true, function(err_category, category_result) {
        if(err_category) {
            res.send(err_category, 500);
            return;
        }
        res.send(category_result, 200);
    });
}