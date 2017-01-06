var _ = require('underscore');
var async = require('async');
var config = require('config');
var ObjectID = require('mongodb').ObjectID;
var schedule = require('node-schedule');
var semaphore = require('semaphore')(1);
var url = require('url');
var winston = require('winston');
var path = require('path');

var aws_util = require('../util/aws-utils');
var brand_util = require('../util/brand-utils');
var database = require('../database/instances/product-info');
var database_general = require('../database/database');
var general_util = require('../util/general-utils');
var product_improve = require('../util/product-improve');
var user_util = require('../util/user-utils');

module.exports = {
    brands_view: _brandsView,
    brand_view: _brandView,
    brand_products_view: _brandProductsView,
    brand_create_view: _brandCreateView,

    brands_get: _brandsGet,
    brand_query: _brandQuery,

    brand_create: _brandCreate,
    brand_update: _brandUpdate,
    brand_delete: _brandDelete,
    brand_style_update: _brandStyleUpdate,
    brand_feature_product: _brandUpdateFeature,
    brand_export_products: _brandExportProducts,
    brand_product_import: _brandImportProducts,
    brand_product_import_data: _brandImportProductData,

    brand_upload_content: _handleUploadContent,
    brand_delete_content: _handleDeleteContent


};

function _brandView(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    if(!user_util.canEditBrand(caller, id)) {
        general_util.render404(req, res);
        return;
    }

    var owner = null, brand = null;

    async.series({

        brand: function(callback) {
            database.pod_brands.findOne({_id: ObjectID(id)}, function(err_brand, brand_result) {
                if (err_brand) {
                    res.send(err_brand, 500);
                    return;
                }
                if (!brand_result) {
                    general_util.render404(req, res);
                    return;
                }
                brand = brand_result;
                callback();
            });
        },

        brand_owner: function(callback) {
            if(!brand.brand_owner) {
                callback();
                return;
            }

            database.pod_brand_owners.findOne({_id: ObjectID(brand.brand_owner)}, function(err_owner, owner_result) {
                owner = owner_result;
                callback();
            });
        }
    }, function() {

        var action = req.param('action');
        if(action) {
            if(action == 'transfer-products') {
                res.render('brand-transfer-products', {
                    caller: caller,
                    title: 'Transfer Products to Brand',
                    brand: brand,
                    owner: owner,
                    url: req.url
                });
                return;
            }
        }
        res.render('brand-edit', {
            caller: caller,
            title: 'Edit Brand',
            brand: brand,
            owner: owner,
            url: req.url
        });
    });
}

function _brandProductsView(req,res)
{
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    res.render('brand-products', {
        caller: caller,
        brand: id,
        title: 'Products',
        url: req.url
    });
}

function _brandsView(req, res) {
    var caller = user_util.getCaller(req);
    res.render('brands', {
        caller: caller,
        title: 'Brands',
        url: req.url
    });
}

function _brandCreateView(req, res) {
    var caller = user_util.getCaller(req);
    res.render('brand-create', {
        caller: caller,
        title: 'Create Brand',
        url: req.url
    });
}

// param id is a list of csv ids
function _brandsGet(req, res) {
    var caller = user_util.getCaller(req);
    var ids = req.param('idList');
    var ids_as_array = _.uniq(ids.split(','));

    // TODO: in the future, prune out any brands that aren't in the caller's managed brands (if not admin)

    // check formatting of ids
    var formatting_ok = _.every(ids_as_array, function(id) {
        return general_util.isValidId(id);
    });
    if(!formatting_ok) {
        res.send('an id was invalid', 500);
        return;
    }

    ids_as_array = _.map(ids_as_array, function(id) {
        return ObjectID(id);
    });
    database.pod_brands.find({_id: {$in: ids_as_array}}).toArray(function(err_brands, brands) {
        if(err_brands != null) {
            res.send(err_brands, 500);
            return;
        }

        if(!caller.role || caller.role == 'user') {
            brands = brands.map(function(brand) {
                return {
                    name: brand.name,
                    product_count: brand.product_count,
                    logo_url: brand.logo_url
                }
            });
        }

        res.send(brands, 200);
    });
}

function _brandQuery(req, res) {
    var caller = user_util.getCaller(req);

    var query = {}, sort_by = {}, fields = { name: 1, link: 1, _id: 1, product_count: 1};
    general_util.buildTableQuery(req.query.sort, req.query.filter, null, query, sort_by, []);

    // if the user isn't an admin, restrict the results to those in the managed brands
    if(caller.role != 'admin' && caller.role != 'action-admin') {
        var idList = [];
        if(!_.isUndefined(caller.managed_brands)) {
            idList = _.map(caller.managed_brands, function(brand) {
                return ObjectID(brand);
            });

        }
        query._id = {$in: idList};
    }

    database_general.query(database.pod_brands,
        {
            query: query,
            fields: fields,
            sort_by: sort_by,
            page: req.query['page'],
            pageSize: req.query['pageSize'],
            case_sensitive: false
        },
        function(err_query, query_result) {
            if(err_query) {
                res.send(err_query, 500);
                return;
            }
            res.send(query_result, 200);
        }
    );
}

function _brandCreate(req, res) {

    // check name filled
    if(_.isUndefined(req.param('name')) || req.param('name').length == 0) {
        res.send('please provide a name', 500);
        return;
    }

    var brand_info = {
        name: req.param('name'),
        last_update: (new Date()).getTime()
    };

    if(!_.isUndefined(req.param('link'))) {
        brand_info.link = req.param('link');
    }

    regExpress = brand_info.name.toLowerCase();
    regExpress = regExpress.replace("(", "\\(");
    regExpress = regExpress.replace(")", "\\)");

    database.pod_brands.find({name:  { $regex: new RegExp("^" + regExpress, "i" ) } } ).toArray(function(err_brands, brands) {
        if(err_brands != null) {
            res.send(err_brands, 500);
            return;
        }
        if(brands.length > 0)
        {
            res.send('Brand name exists already. Choose another name.', 500);
            return;
        }
        else
        {
            database.pod_brands.insert(brand_info, function(err_update, insert_result) {
                if(err_update != null) {
                    res.send(err_update, 500);
                    return;
                }
                console.log(insert_result);
                res.send(insert_result, 200);
            });
        }
    });

}

function _brandUpdate(req, res) {
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);

    if(!user_util.canEditBrand(caller, id)) {
        general_util.send404(res);
        return;
    }

    if(Object.keys(req.query).length > 0) {
        _brandUpdateProperty(req, res);
        return;
    }

    var optional_keys = [
        "link",
        "logo_url",
        "crm_email_endpoint",
        "privacy_policy_url",
        "auto_message",
        "auto_message_expiration",
        "minimum_age",
        "operating_hours",
        "participating"
    ];

    // TODO: move all of this to use general_util.buildUpdate
    if(req.body.auto_message_expiration) {
        try {
            req.body.auto_message_expiration = parseInt(req.body.auto_message_expiration);
        } catch(ex) {
            res.send(ex, 500);
            return;
        }
    }

    var unsets = {}, sets = {};

    // unset any optional key that isn't in the request, set any that are

    _.each(optional_keys, function(key) {
        if(_.isUndefined(req.body[key]) || (req.body[key]).length == 0) {
            unsets[key] = 1;
        } else {
            sets[key] = req.body[key];
        }
    });

    if(sets['crm_email_endpoint'] != "" && sets['crm_email_endpoint'] != undefined)
        sets['participating'] = true;

    if(unsets['crm_email_endpoint'])
        sets['participating'] = (sets['participating'] == "true") ? true : false;

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

    database.pod_brands.update({_id: ObjectID(req.param('id'))}, update_value, function(err_update, update_result) {
        if(err_update != null) {
            res.send(err_update, 500);
            return;
        }
        res.send(update_result, 200);
    });
}

function _brandDelete(req, res) {
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);

    if(!user_util.canEditBrand(caller, id)) {
        general_util.send404(res);
        return;
    }

    database.pod_brands.findOne({_id: ObjectID(req.param('id'))}, function(err_find, brand_result) {
        if(err_find) {
            res.send(err_find, 500);
            return;
        }

        if(!brand_result) {
            general_util.send404(res);
            return;
        }

        if(!brand_result.product_count) {
            database.pod_brands.remove({_id: ObjectID(req.param('id'))}, function(err_remove, remove_result) {
                if(err_remove) {
                    res.send(err_remove, 500);
                    return;
                }
                res.send('ok', 200);
            });
            return;
        }

        res.send('products are associated with this brand', 500);
    });
}

function _brandUpdateProperty(req, res) {
    var brand_id = req.param('id');

    var optional_keys = [
        "brand_owner",
        "link",
        "name",
        "locator",
        "faq",
        "product_info_source"
    ];

    var set_value = {}, unset_value = {};

    // only set the keys provided by the user, limited to those in "optional keys"
    _.each(optional_keys, function(key) {
        if(req.query[key] == "true") {
            if(req.body[key]) {
                set_value[key] = req.body[key];
            } else {
                unset_value[key] = 1;
            }
        }
    });

    var update_value = {};
    if(_.keys(set_value).length > 0) {
        update_value['$set'] = set_value;
    }
    if(_.keys(unset_value).length > 0) {
        update_value['$unset'] = unset_value;
    }

    if(_.keys(update_value).length == 0) {
        res.send('property key not provided', 500);
        return;
    }

    database.pod_brands.update({_id: ObjectID(brand_id)}, update_value, function(err_update, update_result) {
        if(err_update != null) {
            res.send(err_update, 500);
            return;
        }
        res.send(update_result, 200);
    });
}

function _brandStyleUpdate(req, res) {
    var brand_id = req.param('id');

    if(!general_util.isValidId(brand_id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);

    if(!user_util.canEditBrand(caller, brand_id)) {
        general_util.send404(res);
        return;
    }

    // compute computed_style from req.body.components
    var computed_style = _computeStyle(req.body.components) + req.body.custom_styling;

    // TODO: perhaps validate css at some point??
    database.pod_brands.update(
        {_id: ObjectID(brand_id)},
        {
            $set: {
                custom_styling: req.body.custom_styling,
                styling: computed_style,
                styles: req.body.components
            }
        },
        function(err_update, update_result) {
            if(err_update != null) {
                res.send(err_update, 500);
                return;
            }
            res.send({result: update_result}, 200);
        }
    );
}

function _computeStyle(components) {
    var computed_style = '';

    // navbar
    /*
        .navbar-inner {
            background-color: #fff200 !important;
            border-bottom: 1px solid #666;
        }
        .fixed-footer {
            background: #fff200;
        }
        .default-footer {
            background: #fff200;
        }
     */
    computed_style += ".navbar-inner { background-color: " + components.navbar + " !important; border-bottom: 1px solid #666; }";
    computed_style += ".fixed-footer { background: " + components.navbar + "; }";
    computed_style += ".default-footer { background: " + components.navbar + "; }";

    // navbar widgets
    /*
        .dickson-nav>li {
            background: #233e99;
        }
        .navbar-inner ul.nav {
            background: #233e99 !important;
        }
     */
    computed_style += ".dickson-nav>li { background: " + components.navbar_widget + "; }";
    computed_style += ".navbar-inner ul.nav { background: " + components.navbar_widget + " !important; }";

    // navbar widget hover
    /*
        .nav .open>a,
        .navbar .nav>li>a:hover {
            background: #4664C7;
        }
     */
    computed_style += ".nav .open>a, .navbar .nav>li>a:hover { background: " + components.navbar_widget_hover + "; }";

    // accordion heading background
    /*
        .accordion-group:nth-child(3n+1)>.accordion-heading {
          background-color: #fff200;
        }
        .accordion-group:nth-child(3n+2)>.accordion-heading {
          background-color: #fff200;
        }
        .accordion-group:nth-child(3n+3)>.accordion-heading {
          background-color: #fff200;
        }
     */
    computed_style += ".accordion-group:nth-child(3n+1)>.accordion-heading { background-color: " + components.accordion_heading_background + "; }";
    computed_style += ".accordion-group:nth-child(3n+2)>.accordion-heading { background-color: " + components.accordion_heading_background + "; }";
    computed_style += ".accordion-group:nth-child(3n+3)>.accordion-heading { background-color: " + components.accordion_heading_background + "; }";

    // accordion heading text TODO: text outline (optional)
    /*
        .accordion-heading>a {
          color: #233e99;
        }
     */
    computed_style += ".accordion-heading>a { color: " + components.accordion_heading_text + "; }";

    // well backgrounds
    /*
        .well {
            background-color: #fff200;
            background-image: none;
            color: #333;
            border-color: #333;
        }
     */
    computed_style += ".well { background-color: " + components.well_background + "; background-image: none; color: #333; border-color: #333; }";

    // well heading text (TODO: allow optional outline)
    /*
        .well h3 {
            color: #233e99;
            text-shadow: -1px -1px 0 #fff,
              1px -1px 0 #fff,
              -1px 1px 0 #fff,
              1px 1px 0 #fff !important;
        }
     */
    computed_style += ".well h3 { color: " + components.well_heading_text + "; }";

    /*
        html, body {
            background-color: #000;
        }
     */
    computed_style += "html, body { background-color: " + components.body_background + "; }";

    /*
        html, body {
            color: #eee;
        }
        h1,h2,h3,h4,h5 {
            color: #eee;
        }
        strong {

        }
     */
    computed_style += "html, body { color: " + components.body_text + "; }";
    computed_style += "h1,h2,h3,h4,h5 { color: " + components.body_text + "; }";

    /*
        .brand-svg .logo-text-background {
            fill: #0BD318;
        }
     */
    computed_style += ".brand-svg .logo-text-background { fill: " + components.brand_logo_text + " !important; }";

    /*
        .top-left-gradient {
            stop-color:#87FC70;
        }
        .bottom-left-gradient {
            stop-color:#0BD318;
        }
        .top-right-gradient {
            stop-color:#36ed26;
        }
        .bottom-right-gradient {
            stop-color:#01b103;
        }
     */

    computed_style += ".top-left-gradient { stop-color: " + components.brand_logo_top_left + "; }";
    computed_style += ".top-right-gradient { stop-color: " + components.brand_logo_bottom_left + "; }";
    computed_style += ".bottom-left-gradient { stop-color: " + components.brand_logo_top_right + "; }";
    computed_style += ".bottom-right-gradient { stop-color: " + components.brand_logo_bottom_right + "; }";

    return computed_style;
}

function _brandExportProducts(req, res) {
    var brand_id = req.param('id');
    var format = req.param('format');

    if(!general_util.isValidId(brand_id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);

    if(!user_util.canEditBrand(caller, brand_id)) {
        general_util.send404(res);
        return;
    }

    brand_util.getBrandData(caller, brand_id, function(err_brand, brand) {
        if(err_brand) {
            res.send(err_brand, 500);
            return;
        }

        if(!brand) {
            general_util.send404(res);
            return;
        }


	if(format == 'xlsx') {
            brand_util.exportProductsForBrandAsXlsx(caller, brand_id, function(err_export, export_contents) {
       	        if(err_export) {
                    res.send(err_export, 500);
                    return;
            	 }

            	res.header('Content-Disposition', 'inline; filename="Products for ' + brand.name + '.xlsx"');
            	res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.send(export_contents, 200);
	    });
	} else {
	    brand_util.exportProductsForBrandAsCsv(caller, brand_id, function(err_export, export_contents) {
		    if(err_export) {
		        res.send(err_export, 500);
			return;
		    }
	    
	    res.header('Content-Disposition', 'inline; filename="Products for ' + brand.name + '.csv"');
	    res.header('Content-Type', 'text/csv');
            res.send(export_contents, 200);
            });
	}
    });
}

function _brandImportProducts(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    if(!user_util.canEditBrand(caller, id)) {
        general_util.render404(req, res);
        return;
    }

    database.pod_brands.findOne({_id: ObjectID(id)}, function(err_brand, brand) {
        if(err_brand != null) {
            res.send(err_brand, 500);
            return;
        }
        if(brand == null) {
            general_util.render404(req, res);
            return;
        }

        res.render('brand-product-import', {
            caller: caller,
            brand: brand,
            title: 'Product Importer',
            url: req.url
        });
    });
}

function _brandImportProductData(req, res) {

    var brand_id = req.param('id');

    if(!general_util.isValidId(brand_id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);

    if(!req.files.file) {
        res.send('no file attached', 500);
        return;
    }

    var fileType = path.extname(req.files.file.name);

    if(fileType == '.xlsx') {
	brand_util.importProductsForBrandWithXlsx(caller, brand_id, req.files.file, function(error_import, data) {
            if(error_import) {
                res.send(error_import, 500);
                return;
            }
            res.send(data, 200);
        });
    } else {
        brand_util.importProductsForBrandWithCsv(caller, brand_id, req.files.file, function(error_import, data) {
	    if(error_import) {
	        res.send(error_import, 500);
		return;
	    }
	    
	    res.send(data, 200)
	});
    }
}

// TODO: feature does not update SOLR indices
function _brandUpdateFeature(req, res) {
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);

    if(!user_util.canEditBrand(caller, id)) {
        general_util.send404(res);
        return;
    }

    if(req.query['unfeature'] || req.query['feature']) {

        async.series({

            unfeature: function(callback) {
                if(!req.query['unfeature']) {
                    callback();
                    return;
                }
                _buildFeatureQuery(id, req.query['unfeature'], function(err_query, query_result) {
                    database.ean.update(query_result, {$unset: {feature_weight: 1, last_update: 1}}, {multi: true}, function(err_update) { // , update_results
                        if(err_update) {
                            callback(err_update);
                            return;
                        }

                        // todo: do in background with mutex?
                        product_improve.addSolrIndices(query_result, callback);
                    });
                });
            },

            feature: function(callback) {
                if(!req.query['feature']) {
                    callback();
                    return;
                }
                _buildFeatureQuery(id, req.query['feature'], function(err_query, query_result) {
                    database.ean.update(query_result, {$set: {feature_weight: 1, last_update: 1}}, {multi: true}, function(err_update) { // , update_results
                        if(err_update) {
                            callback(err_update);
                            return;
                        }

                        // todo: do in background with mutex?
                        product_improve.addSolrIndices(query_result, callback);
                    });
                });
            }

        }, function (err_async, async_results) {
            if(err_async) {
                res.send(err_async, 500);
                return;
            }
            res.send(async_results, 200);
        });
        return;
    }

    res.send('a feature query parameter must be supplied', 500);
}

// we accept "all", an id, an id list
// will query on products, given the brand and scope descriptor
function _buildFeatureQuery(brand_id, feature_descriptor, callback2) {
    if(feature_descriptor == 'all') {

        // build "brand-only" query
        callback2(null, { brand: brand_id });
        return;
    }

    if(general_util.isValidId(feature_descriptor)) {

        // build "product-only" query
        callback2(null, { brand: brand_id });
        return;
    }

    // feature list descriptor
    var product_ids = feature_descriptor.split(',');
    var is_ok = _.every(product_ids, function(id) {
        return general_util.isValidId(id);
    });
    if(is_ok) {
        callback2(null, _.map(product_ids, function(id) { return ObjectID(id); }));
        return;
    }

    callback2('unknown feature query parameter');
}

function _handleDeleteContent(req, res) {
    var brand_id = req.param('id');

    if(!general_util.isValidId(brand_id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);

    if(!user_util.canEditBrand(caller, brand_id)) {
        general_util.send404(res);
        return;
    }

    var url_to_delete = req.param('url');
    var type_to_delete = req.param('type');
    if(!url_to_delete && !type_to_delete) {
        res.send('no url or type provided', 500);
        return;
    }

    if(url_to_delete) {
        semaphore.take(function () {
            database.pod_brands.findOne({_id: ObjectID(brand_id)}, function (err_brand, brand) {
                if (err_brand) {
                    semaphore.leave();
                    res.send(err_brand, 500);
                    return;
                }

                if (!brand.content || brand.content.length == 0) {
                    semaphore.leave();
                    general_util.send404(res, 'brand content not found');
                    return;
                }

                var new_content = _.without(brand.content, url_to_delete);
                if (new_content.length == brand.content) {
                    semaphore.leave();
                    general_util.send404(res, 'brand content not found');
                    return;
                }

                aws_util.file_delete(url_to_delete, function (err_delete_s3) { // , delete_result
                    if (err_delete_s3) {
                        semaphore.leave();
                        res.send(err_delete_s3, 500);
                        return;
                    }
                    database.pod_brands.update({_id: brand._id}, {$pull: {content: url_to_delete}}, function (err_update, update_result) {
                        semaphore.leave();
                        if (err_update) {
                            res.send(err_update, 500);
                            return;
                        }
                        res.send({update_count: update_result}, 200);
                    });
                });
            });
        });
        return;
    }

    if(type_to_delete != 'unused') {
        res.send('unsupported type', 500);
        return;
    }

    // images can be used by brand logo, product.product_images, product.nutrition_labels
    var brand;
    var remaining;
    async.series({

        'brand': function(callback) {
            database.pod_brands.findOne({_id: ObjectID(brand_id)}, function (err_brand, brand_result) {
                if(err_brand) {
                    res.send(err_brand, 500);
                    return;
                }
                brand = brand_result;
                remaining = brand.content;
                callback();
            });
        },

        'brand_logo': function(callback) {
            remaining = _.without(remaining, brand.logo_url);
            callback();
        },

        'product_images': function(callback) {
            database.ean.distinct('images', {brand: brand_id, images: {$in: remaining}}, function(err_distinct, distinct_content) {
                if(err_distinct) {
                    res.send(err_distinct, 500);
                    return;
                }
                remaining = _.difference(remaining, distinct_content);
                callback();
            });
        },

        'nutrition_labels': function(callback) {
            database.ean.distinct('nutrition_labels', {brand: brand_id, nutrition_labels: {$in: remaining}}, function(err_distinct, distinct_content) {
                if(err_distinct) {
                    res.send(err_distinct, 500);
                    return;
                }
                remaining = _.difference(remaining, distinct_content);
                callback();
            });
        },

        's3_delete': function(callback) {
            if(remaining.length == 0) {
                callback();
                return;
            }
            aws_util.files_delete(config['aws']['bucket'], remaining, callback);
        },

        'reference_delete': function(callback) {
            if(remaining.length == 0) {
                callback();
                return;
            }

            semaphore.take(function () {
                brand.content = _.difference(brand.content, remaining);
                database.pod_brands.update({_id: ObjectID(brand_id)}, {$set: {content: brand.content}}, function (err_update, update_result) {
                    semaphore.leave();
                    callback(err_update, update_result);
                });
            });
        }

    }, function(err_remove) { // , remove_result
        if(err_remove) {
            res.send(err_remove, 500);
            return;
        }
        res.send({removed: remaining}, 200);
    });
}

function _handleUploadContent(req, res) {
    var brand_id = req.param('id');

    if(!general_util.isValidId(brand_id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);

    if(!user_util.canEditBrand(caller, brand_id)) {
        general_util.send404(res);
        return;
    }

    database.pod_brands.findOne({_id: ObjectID(brand_id)}, function(err_brand, brand) {
        if(err_brand) {
            res.send(err_brand, 500);
            return;
        }

        if(!brand) {
            general_util.send404(res, 'brand not found');
            return;
        }

        if(!req.files.file) {
            res.send('no file attached', 500);
            return;
        }

        _uploadFile(brand, req.files.file, function(err_upload, upload_result) {
            if(err_upload) {
                res.send(err_upload, 500);
                return;
            }
            res.send({url: upload_result}, 200);
        });
    });
}

function _uploadFile(brand, file, callback2) {
    aws_util.file_upload('', file, "brand-content/" + brand.name, function(err_upload, upload_result) {
        if(err_upload) {
            callback2(err_upload);
            return;
        }
        semaphore.take(function() {
            database.pod_brands.update(
                {_id: brand._id},
                {$push: {content: upload_result}},
                function (err_brand_update) { // , brand_update_result
                    semaphore.leave();
                    if (err_brand_update) {
                        callback2('could not associate with brand: ' + err_brand_update);
                        return;
                    }
                    callback2(null, upload_result);
                }
            );
        });
    });
}
