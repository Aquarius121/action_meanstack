var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');
var schedule = require('node-schedule');
var fs = require('fs');

var audit_database = require('../database/instances/action-audit');
var database = require('../database/instances/product-info');
var database_demo = require('../database/instances/demo-product-info');
var database_general = require('../database/database');

var brand_improve = require('../util/brand-improve');
var brand_util = require('../util/brand-utils');
var general_util = require('../util/general-utils');
var iri = require('../util/iri-utils');
var product_util = require('../util/product-utils');
var solr = require('../solr');
var user_util = require('../util/user-utils');
var wilke = require('../util/wilke-utils');

module.exports = {
    products_view: _productsView,
    product_view: _productView,
    product_create_view: _productCreateView,
    products_find_view: _productsFindView,
    product_where_to_buy_view: _productWhereToBuyView,
    product_brand_message_view: _productBrandMessageView,
    product_faq_view: _productFAQView,
    product_info_view: _productINFOView,

    products_open_search: _productsOpenSearch,
    product_query: _productQuery,
    products_for_brand: _productsForBrand,
    product_get: _productGet,
    product_where_to_buy: _productWhereToBuy,

    product_create: _productCreate,
    product_update: _productUpdate,
    product_delete: _productDelete,
    products_transfer_brand: _productsTransferBrand,
    hans:_hansGet
};

function _productsView(req, res) {
    var caller = user_util.getCaller(req);
    res.render('products', {
        caller: caller,
        title: 'Products',
        url: req.url
    });
}
var cursor = 0;
var resultArray = [];
function updateIngred(){
    console.log(cursor);
    rest = database.ean.find({ingredients: new RegExp("nutrition:")}, {limit: 100}).toArray(function (err, items) {

        //winston.info(items.length);
        //res.send(items.length, 500);
        //winston.info(items.length);

        for (i = 0; i < items.length; i++) {

            var index = items[i].ingredients.indexOf("nutrition:");
            //winston.info(items[i].ingredients);
            if (index != -1) {
                var nut_label = items[i].ingredients.substr(index);
                var ingred = items[i].ingredients.substring(0, index);
                if (items[i].nutrition_labels)
                    nut_label = items[i].nutrition_labels + "<" + "hr>" + nut_label;

                database.ean.update({_id: items[i]._id}, {
                    $set: {
                        nutrition_labels: nut_label,
                        ingredients: ingred
                    }
                }, function (err, result) {
                    //winston.info(result);
                    ;
                });
            }

        }
        if(items.length < 100) {
            winston.info("finish");
            return;
        }
        cursor++;

        updateIngred();
    });

}
function recoverfromDemo(){
    cursor++;
    winston.info(cursor);
    /*
    rest = database.ean.find({ean:resultArray[cursor].ean}).toArray(function (err, items) {

        //winston.info(items.length);
        //res.send(items.length, 500);
        winston.info(items[0].nutrition_labels);
        winston.info(items[0].ean);
        var nut_label =resultArray[cursor].nutrition_labels;
        if(items[0].nutrition_labels)
        {
            nut_label += "<" + "hr>" + items[0].nutrition_labels;
        }
        database.ean.update({_id: items[0]._id}, {
            $set: {
                nutrition_labels: nut_label
            }
        }, function (err, result) {
            cursor++;
            recoverfromDemo();
        });

    });
    */
    if(cursor == resultArray.length)
    {
        winston.info("Error");
        return;
    }
    database.ean.update({_id: resultArray[cursor]._id}, {
        $set :{name: '-'}
    }, function (err, result) {
        recoverfromDemo();
        //winston.info("yes");
    });
    /*
    rest = database_demo.ean_old.find({ean:resultArray[cursor].ean}).toArray(function (err, items) {

        //winston.info(items.length);
        //res.send(items.length, 500);

        var update_query = {};
        for(key in items[0])
        {
            if(key == "ingredients" || key == "nutrition_labels" || key == "_id")
                continue;
            update_query[key] = items[0][key];
        }

        if(items.length > 0) {
            database.ean.update({_id: items[0]._id}, {
                $set: update_query
            }, function (err, result) {
                cursor++;
                recoverfromDemo();
                //winston.info("yes");
            });
        }
        else {
            winston.info("no id:"+resultArray[cursor].ean);
            cursor++;
            recoverfromDemo();
        }
    });
    */
}
function _hansGet(req,res)
{
    /*
    res = database.ean.find({nutrition_labels:{$exists:true}}).toArray(function(err, items) {
        for(i=0;i<items.length;i++)
        {
            src = "<img src='"+items[i].nutrition_labels[0] + "'/>";
            database.ean.update({_id:items[i]._id},{$set: {nutrition_labels:src}},function(err,result){
                console.log(result);
            });
        }

    });
    */


    // ingredients update and add it to product label
    winston.info("asdfa");
    //updateIngred();
    //
    /*
    res = database_demo.ean.find({nutrition_labels:{$exists:true}}).toArray(function(err, items) {
        //winston.info(items.length);
        resultArray = items;
        recoverfromDemo();
    })
    */
    /*
    res = database.ean.find({name:{$exists:false}}).toArray(function(err, items) {
        //winston.info(items.length);
        resultArray = items;
        //winston.info(resultArray.length);
        recoverfromDemo();
    })
    */
    //res = database.ean.find({nutrition_labels:{$exists:true}}).toArray(function(err, items) {
    /*
    res = database.ean.find({nutrition_labels:{$exists:true}}).toArray(function(err, items) {
        for(i=0;i<items.length;i++)
        {
            if(typeof items[i].nutrition_labels == "string") {
                src = items[i].nutrition_labels.substr(items[i].nutrition_labels.indexOf("src='") + 5, items[i].nutrition_labels.indexOf("'/>") - items[i].nutrition_labels.indexOf("src='") - 5);

                var label = new Array(src)
                database.ean.update({_id: items[i]._id}, {$set: {nutrition_labels: label}}, function (err, result) {
                    console.log(result);
                });
            }
            else
            {
                console.log(items[i].ean);
            }
        }

    });*/
}
function _productGet(req, res) {
    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);
    var code = req.param('code');
    var source = req.param('source');

    product_util.getProductData(caller, ip, code, true, function(err, product_data) {
        if(err != null) {
            res.send(err, 500);
            return;
        }
        // TODO: check source matches one of scan/search

        if(product_data == null) {

            // report source, code, no brand, not found, not participating
            _reportProductGet(req, source, code, undefined, undefined, false, false);
            general_util.send404(res);
            return;
        }

        product_data.participating = product_util.isParticipating(product_data);


        // report source, code, brand, found, possibly participating
        _reportProductGet(req, source, code, product_data.product, product_data.brand, true, product_data.participating);

        res.send(product_data, 200);
    });
}

function _productView(req, res) {
    var caller = user_util.getCaller(req);
    var code = req.param('code');
    var ip = general_util.getIPAddress(req);
    var is_tpl = req.query.mode && req.query.mode.toLowerCase() == 'edit' ? false : true;

    product_util.getProductData(caller, ip, code, is_tpl, function(err, product_data) {
        if(err != null) {
            res.send(err, 500);
            return;
        }

        if(!product_data || !product_data.product) {

            // report source = search, code, brand, not found, not participating
            _reportProductGet(req, 'search', code, undefined, undefined, false, false);
            res.redirect('/products/find/view?missing-code=' + code);
            return;
        }

        var render_data = {
            title: 'Product',
            product: product_data.product,
            url: req.url,
            caller: caller
        };

        if(!_.isUndefined(product_data.brand)) {
            render_data.brand = product_data.brand;
            render_data.brand = _.omit(render_data.brand, 'content');
        }

        product_data.participating = product_util.isParticipating(product_data);

        // demux the render mode
        if(!_.isUndefined(req.query.mode)) {

            // enforce access limitations on the edit mode
            if(req.query.mode.toLowerCase() == 'edit') {
                if(render_data.caller && (render_data.caller.role == 'admin' || render_data.caller.role == 'action-admin')) {
                    res.render('product-edit', render_data);
                    return;
                }

                // for brand managers, make sure the product belongs to a managed brand
                if(product_data.brand && caller && caller.role == 'brand-manager') {
                    if(caller.managed_brands.indexOf(product_data.product.brand) != -1) {
                        res.render('product-edit', render_data);
                        return;
                    }
                }

                general_util.send404(res);
                return;
            }

            // handle confirm mode, but only show it if there are product images
            if(req.query.mode.toLowerCase() == 'confirm' && typeof(product_data.product.images) != 'undefined' && product_data.product.images.length > 0) {
                res.render('product-confirm', render_data);
                return;
            }

            // report source = search, code, brand, found, possibly participating
            _reportProductGet(req, 'search', code, product_data.product, product_data.brand, true, product_data.participating);

            res.render('product', render_data);
            return;
        }

        // report source = search, code, brand, found, possibly participating
        _reportProductGet(req, 'search', code, product_data.product, product_data.brand, true, product_data.participating);
        res.render('product', render_data);
    });
}

function _productCreateView(req, res) {
    var caller = user_util.getCaller(req);

    var render_data = {
        caller: caller,
        title: 'Create Product',
        url: req.url
    };
    if(req.param('brand')) {
        database.pod_brands.findOne({_id: ObjectID(req.param('brand'))}, function(err_brand, brand) {
            render_data.brand = brand;
            res.render('product-create', render_data);
        });

        return;
    }
    res.render('product-create', render_data);
}

function _productsFindView(req, res) {

    var render_data = {
        title: 'Find',
        url: req.url,
        missing_code: req.param('missing-code')
    };

    if(!_.isUndefined(req.session['passport']) && !_.isUndefined(req.session['passport'].user)) {
        render_data.caller = user_util.getCaller(req);
    }

    res.render('products-find', render_data);
}

function _productWhereToBuyView(req, res) {
    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);

    product_util.getProductData(caller, ip, req.param('code'), false, function(err_product, product_data) {
        if(err_product != null) {
            res.send(err_product, 500);
            return;
        }

        if(!product_data || !product_data.product) {
            general_util.send404(res);
            return;
        }

        var render_data = {
            title: 'Where to Buy',
            product: product_data.product,
            url: req.url,
            caller: caller
        };

        if(!_.isUndefined(product_data.brand)) {
            render_data.brand = product_data.brand;
        }

        res.render('product-where-to-buy', render_data);
    });
}

function _productBrandMessageView(req, res) {
    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);

    product_util.getProductData(caller, ip, req.param('code'), true, function(err_product, product_data) {
        if(err_product != null) {
            res.send(err_product, 500);
            return;
        }

        if(!product_data || !product_data.product) {
            general_util.send404(res);
            return;
        }

        var render_data = {
            title: 'Brand Message',
            product: product_data.product,
            url: req.url,
            caller: caller
        };

        if(!_.isUndefined(product_data.brand)) {
            render_data.brand = product_data.brand;
        }

        res.render('product-brand-message', render_data);
    });
}

function _productFAQView(req, res) {
    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);
    var code =req.param('code');

    product_util.getProductData(caller, ip, code, false, function(err_product, product_data) {
        if(err_product != null) {
            res.send(err_product, 500);
            return;
        }

        if(!product_data || !product_data.product) {
            general_util.send404(res);
            return;
        }

        var render_data = {
            title: 'Product FAQ',
            product: product_data.product,
            url: req.url,
            caller: caller
        };

        if(!_.isUndefined(product_data.brand)) {
            render_data.brand = product_data.brand;
        }

        res.render('product-faq', render_data);
        _reportProductGet(req, 'web', code, product_data.product, product_data.brand, true, product_data.participating);
    });
}

function _productINFOView(req, res) {
    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);
    var code =req.param('code');

    product_util.getProductData(caller, ip, code, false, function(err_product, product_data) {
        if(err_product != null) {
            res.send(err_product, 500);
            return;
        }

        if(!product_data || !product_data.product) {
            general_util.send404(res);
            return;
        }

        var render_data = {
            title: 'Product INFO',
            product: product_data.product,
            url: req.url,
            caller: caller
        };

        if(!_.isUndefined(product_data.brand)) {
            render_data.brand = product_data.brand;
        }

        res.render('product-info', render_data);
        _reportProductGet(req, 'web', code, product_data.product, product_data.brand, true, product_data.participating);
    });
}

function _correctQuery(query)
{

    var synonym_file = fs.readFileSync(__dirname + '/reference/synonym.json', 'utf8');
    console.log(synonym_file);
    var synonym_table = JSON.parse(synonym_file.toLowerCase());

    var correction = _.pick(synonym_table,query.toLowerCase());
    if(!_.isNull(correction) && !_.isEmpty(correction))
        return _.values(correction)[0];
    else
        return query;
}

function _productsOpenSearch(req, res) {
    var terms = req.query['ean_or_name'];
    var page = req.query['page'];
    var pageSize = req.query['pageSize'];
    var returnCount = req.query['count'];

    if(terms) {
        terms = _correctQuery(terms.trim());
    }

    _searchSolr(terms, req.query['limit'], page, pageSize, function(err, solr_results) {
        if(err != null) {
            winston.debug('an error occurred during solr product search, falling back to mongo search: ' + (err.message ? err.message : err));
            _mongoQuery(req, res);
            //res.send(err, 500);
            return;
        }

        var docs = solr_results.response['docs'];
        var id_docs = _.pluck(docs, 'id');
        var results = [];
        var products_from_query;

        async.series({

            get_products: function(callback) {
                product_util.getProductsByIds(id_docs, null, function(err_query, query_results) {
                    if(err_query != null) {
                        res.send('an error occurred: ' + err_query, 500);
                        return;
                    }

                    products_from_query = query_results;

                    callback();
                });
            },

            get_brand_logos: function(callback) {
                var brand_ids = _.pluck(products_from_query, 'brand');
                brand_ids = _.reject(brand_ids, function(num) { return !num; });

                brand_util.getBrandsByIds(brand_ids, {
                    _id: 1,
                    logo_url: 1
                }, function(err_brands, brand_results) {
                    if(err_brands) {
                        callback(err_brands);
                        return;
                    }

                    // convert brand ids to hex strings for easy queries
                    brand_results.forEach(function(brand_record) {
                         brand_record._id = brand_record._id.toHexString();
                    });

                    // apply brand logo to each product, if able
                    products_from_query.forEach(function(product_record) {
                        if(product_record.brand) {
                            var matching_brand = _.findWhere(brand_results, {
                                _id: product_record.brand
                            });

                            if(matching_brand) {
                                product_record.brand_logo_url = matching_brand.logo_url;
                            }
                        }
                    });

                    callback();
                });
            },

            clean: function(callback) {
                _.each(docs, function(doc) { //, doc_index
                    var result = _.find(products_from_query, function(ean_result) {
                        return ean_result._id.toHexString() == doc.id;
                    });
                    if(!_.isUndefined(result)) {
                        results.push(result);
                    }
                });

                callback();
            },

            prepare_results: function(callback) {
                var audit_record = audit_database.generateAuditRecord(req, {
                    'provider':     'solr',
                    'text':         terms,
                    'results':      solr_results.response['numFound']
                });

                audit_database.reportEvent('product_searches', audit_record);

                if(returnCount) {
                    var result_count = solr_results.response['numFound'];

                    res.send({
                        products: results,
                        count: solr_results ? result_count : results.length
                    }, 200);
                    return;
                }
                res.send(results, 200);
            }

        }, function(err_async, async_results) {
            // unused
        });
    });
}

function _searchSolr(query_field, limit, page_query, pageSize_query, callback2) {
    // turn EAN/UPC queries into wildcard searches
    //if(eval(/^\d+$/).test(req.query['ean_or_name'])) {
    var query_regex = '*' + query_field + '*';
    //}

    var page = 0, pageSize = 20, default_limit = 1000, max_limit = 1000;

    // the caller may specify page/pageSize or limit.  if both are defined, we will use pageSize

    if(limit) {
        var limit_to_set = parseInt(limit);
        pageSize = (_.isNaN(limit_to_set) ? default_limit : limit_to_set);
        pageSize = (pageSize > max_limit ? max_limit : pageSize);
    }

    if(page_query && pageSize_query) {
        var value_to_set = parseInt(page_query);
        page = _.isNaN(value_to_set) ? page : value_to_set;

        value_to_set = parseInt(pageSize_query);
        pageSize = _.isNaN(value_to_set) ? pageSize : value_to_set;
        pageSize = (pageSize > max_limit ? max_limit : pageSize);
    }

    async.series({
        'try-ean': function(callback) {
            try {
                var query_value = parseInt(query_field);
                if(isNaN(query_value)) {
                    callback();
                    return;
                }
            } catch(ex) {
                callback();
                return;
            }

            var query2 = solr.product_client.createQuery()
                .q({text : query_regex})
                .matchFilter('feature_weight_i', '[1 TO *]')
                .start(page * pageSize)
                .rows((page + 1) * pageSize)
                .sort('feature_weight_i desc, score desc');
            solr.product_client.search(query2, callback2);
        },

        'dismax_query': function(callback) {

            dismaxQuery = query_field.replace("-"," ");
            dismaxQuery = dismaxQuery.replace(" ","* ");
            dismaxQuery += "*";
            var query = solr.product_client.createQuery()
                .q({text : dismaxQuery})
                .edismax()
                .start(page * pageSize)
                .rows((page + 1) * pageSize)
                .sort({ 'part':'desc', 'score': 'desc', 'feature_weight_i': 'desc'});

            bq_query = query_field.replace(" ", "+");

            query = query.qf({brand: 2, name: 30, ean: 30}).bq('name%3A"' + bq_query + '"%5E100');

            solr.product_client.search(query, function(err, solr_results) {

                if(err) {
                    callback2(err);
                    return;
                }

                // if no results, try again without dismax
                if(solr_results.response['numFound'] == 0) {
                    console.log("dismax no");
                    query = solr.product_client.createQuery()
                        .q({text : query_regex})
                        .matchFilter('feature_weight_i', '[1 TO *]')
                        .start(page * pageSize)
                        .rows((page + 1) * pageSize)
                        .sort('feature_weight_i desc, score desc');

                    solr.product_client.search(query, callback2);
                    return;
                }
                callback2(null, solr_results);
            });


            /*
            var query = solr.product_client.createQuery()
                .q({text : query_regex})
                .matchFilter('feature_weight_i', '[0 TO *]')
                .edismax()
                .fl('name','brand_name','ean')
                .start(page * pageSize)
                .rows((page + 1) * pageSize)
                .sort({'score': 'desc','feature_weight_i': 'desc'});

            query = query.qf({brand_name: 2, name: 30, ean: 1});
            */


        }
    }, function(err_async) {

    });

}

function _productQuery(req, res) {
    var caller = user_util.getCaller(req);

    var query = {}, sort_by = {}, options = {};
    general_util.buildTableQuery(req.query.sort, req.query.filter, null, query, sort_by, ['brand']);

    // find index hint
    if(!_.isUndefined(query.name)) {
        options['hint'] = {ean: 1, name: 1};
    } else if(!_.isUndefined(query.upc)) {
        options['hint'] = {ean: 1, upc: 1};
    } else if(!_.isUndefined(query.ean)) {
        options['hint'] = {ean: 1};
    }

    // if the user is a brand manager, restrict the results to those in the managed brands
    if(caller.role == 'brand-manager') {
        var inIdListQuery = {brand: {$in: []}};

        // limit to managed brands (avoid using $in if able)
        if(!_.isUndefined(caller.managed_brands)) {
            if(caller.managed_brands.length == 1) {
                inIdListQuery = {brand: caller.managed_brands[0]};
            } else {
                inIdListQuery = {brand: {$in: caller.managed_brands}};
            }
        }

        // if the query already has a brand query, $and it with this requirement
        if(!_.isUndefined(query.brand)) {
            if(_.isUndefined(query['$and'])) {
                query['$and'] = [];
            }
            query['$and'].push(inIdListQuery);
        } else {
            query = _.extend(query, inIdListQuery);
        }
    }

    var fields = {
        _id: 1,
        brand: 1,
        brand_name: 1,
        ean: 1,
        name: 1,
        upc: 1,
        feature_weight: 1,
        images: 1,
        promo_videos: 1
    };

    database_general.query(database.ean,
        {
            query: query,
            fields: fields,
            sort_by: sort_by,
            page: req.query['page'],
            pageSize: req.query['pageSize'],
            case_sensitive: true
        },
        function(err_query, query_result) {
            if(err_query) {
                res.send(err_query, 500);
                return;
            }

            if(req.param('format') && req.param('format') == 'csv') {
                var csv_contents = '';
                query_result.rows.forEach(function(result) {
                    csv_contents += '"' + result.ean + '","' + result.name + '"\n';
                });
                res.setHeader('Content-disposition', 'attachment; filename=products.csv');
                res.charset = 'utf-8';
                res.header('Content-Type', 'text/csv');
                res.send(csv_contents, 200);
                return;
            }

            res.send(query_result, 200);
        }
    );
}

function _productsForBrand(req,res)
{
    var caller = user_util.getCaller(req);

    var query = {}, sort_by = {}, options = {};
    general_util.buildTableQuery(req.query.sort, req.query.filter, null, query, sort_by, ['brand']);

    // find index hint
    if(!_.isUndefined(query.name)) {
        options['hint'] = {ean: 1, name: 1};
    } else if(!_.isUndefined(query.upc)) {
        options['hint'] = {ean: 1, upc: 1};
    } else if(!_.isUndefined(query.ean)) {
        options['hint'] = {ean: 1};
    }

    // if the user is a brand manager, restrict the results to those in the managed brands
    if(caller.role == 'brand-manager') {
        var inIdListQuery = {brand: {$in: []}};

        // limit to managed brands (avoid using $in if able)
        if(!_.isUndefined(caller.managed_brands)) {
            if(caller.managed_brands.length == 1) {
                inIdListQuery = {brand: caller.managed_brands[0]};
            } else {
                inIdListQuery = {brand: {$in: caller.managed_brands}};
            }
        }

        // if the query already has a brand query, $and it with this requirement
        if(!_.isUndefined(query.brand)) {
            if(_.isUndefined(query['$and'])) {
                query['$and'] = [];
            }
            query['$and'].push(inIdListQuery);
        } else {
            query = _.extend(query, inIdListQuery);
        }
    }

    var fields = {
        _id: 1,
        brand: 1,
        brand_name: 1,
        ean: 1,
        name: 1,
        upc: 1,
        feature_weight: 1,
        images: 1,
        promo_videos: 1
    };

    database_general.query(database.ean,
        {
            query: query,
            fields: fields,
            sort_by: sort_by,
            page: req.query['page'],
            pageSize: req.query['pageSize'],
            case_sensitive: true
        },
        function(err_query, query_result) {
            if(err_query) {
                res.send(err_query, 500);
                return;
            }

            if(req.param('format') && req.param('format') == 'csv') {
                var csv_contents = '';
                query_result.rows.forEach(function(result) {
                    csv_contents += '"' + result.ean + '","' + result.name + '"\n';
                });
                res.setHeader('Content-disposition', 'attachment; filename=products.csv');
                res.charset = 'utf-8';
                res.header('Content-Type', 'text/csv');
                res.send(csv_contents, 200);
                return;
            }

            database_general.query(database.pod_brands,
                {
                    query: {_id:ObjectID(query.brand)},
                    fields: {logo_url: 1},
                    case_sensitive: true
                },
                function(err_query, brand_query_result) {
                    if(err_query) {
                        res.send(err_query, 500);
                        return;
                    }

                    query_result.rows.forEach(function(result){
                       result.brand_logo_url = brand_query_result[0].logo_url;
                    });

                    res.send(query_result, 200);
                }
            );
        }
    );
}

function _productCreate(req, res) {
    var caller = user_util.getCaller(req);

    var name = req.param('name');
    if(_.isUndefined(name) || name.trim().length == 0) {
        res.send('a name must be provided', 500);
        return;
    }

    var ean = req.param('ean');
    if(!ean || ean.trim().length == 0) {
        res.send('an ean must be provided', 500);
        return;
    }

    if(ean.trim().length != 13 && ean.trim().length != 8) {
        res.send('an ean must be 8 or 13 characters', 500);
        return;
    }

    var upc = req.param('upc');
    //if((!upca || upca.trim().length == 0) && (!upce || upce.trim().length == 0)) {
    if(!upc || upc.trim().length == 0) {
        res.send('a upc must be provided', 500);
        return;
    }

    if(upc && upc.trim().length != 12) {
        res.send('a upc-a must be 12 characters', 500);
        return;
    }

    database.ean.findOne({ean: ean}, function(err_product_query, product_result) {
        if(err_product_query != null) {
            res.send(err_product_query, 500);
            return;
        }

        if(product_result != null) {
            res.send('a product exists with that ean', 500);
            return;
        }

        var product_record = {
            name: general_util.removeHtmlFromString(name),
            ean: ean,
            upc: upc,

            admin_attributes: {
                name: name,
                added_by: caller._id
            }
        };

        var async_functions = [];

        var brand = req.param('brand');
        if(brand) {

            if(!general_util.isValidId(brand)) {
                res.send('invalid id for brand', 500);
                return;
            }

            if(!user_util.canEditBrand(caller, brand)) {
                general_util.send404(res);
                return;
            }

            async_functions.push(function(callback) {
                database.pod_brands.findOne({_id: ObjectID(brand)}, function(err_brand, brand_info) {
                    if(err_brand != null) {
                        res.send(err_brand, 500);
                        return;
                    }

                    if(brand_info == null) {
                        res.send('brand not found', 500);
                        return;
                    }

                    product_record.brand = brand_info._id.toHexString();
                    product_record.brand_name = brand_info.name;

                    // increment the brand product count (TODO: do this AFTER product is actually inserted?)
                    database.pod_brands.update({_id: ObjectID(brand)}, {$inc: {product_count: 1}}, function(err_inc) {
                       callback(err_inc);
                    });
                });
            });
        }

        // for brand managers, a brand MUST be specified
        if(caller.role == 'brand-manager' && !brand) {
            res.send('a brand must be specified', 500);
            return;
        }

        async.series(async_functions, function() { // async_err, async_results
            database.ean.insert(product_record, function(err_insert, insert_result) {
                if(!insert_result || insert_result.length == 0) {
                    res.send('not inserted', 500);
                    return;
                }

                product_record._id = insert_result[0]._id;
                solr.product_client.add(solr.generateProductRecord(product_record), function(err){ //, obj
                    if(err) {
                        winston.error(err);
                    }
                    res.send(insert_result, 200);
                });
            });
        });
    });
}

function _productUpdate(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    // if the caller is not an admin or brand-manager (we'll check brand manager belongs to brand below)
    if(caller.role != 'admin' && caller.role != 'brand-manager' && caller.role != 'action-admin') {
        general_util.send404(res);
        return;
    }

    database.ean.findOne({_id: ObjectID(id)}, function(err_product, product) {
        if(err_product != null) {
            res.send(err_product, 500);
            return;
        }

        if(product == null) {
            general_util.send404(res);
            return;
        }

        // restrict brand managers to products within their managed brands
        if(caller.role == 'brand-manager') {

            // if the product isn't associated with a brand
            if(_.isNull(product.brand) || _.isUndefined(product.brand)) {
                general_util.send404(res);
                return;
            }

            // if caller has no managed brands, or the product isn't within a managed brand
            if(!caller.managed_brands || caller.managed_brands.indexOf(product.brand) == -1) {
                general_util.send404(res);
                return;
            }
        }

        // keys used for properties = "basic"
        var basic_keys = [
            "name",
            "feature_weight"
        ];

        // keys used for properties = "self-help"
        var extended_keys = [
            "brand_message",
            "faq",
            "ingredients",
            "instructions",
            "map_search_types",
            "master_ean"
        ];

        var social_keys = [
            "facebook_link",
            "sms_number",
            "phone_number",
            "twitter_link",
            "instagram_link"
        ];

        var media_keys = [
            "image_style",
            "nutrition_labels",
            "images",
            "promo_videos",
            "promo_images"
        ];

        var auto_message_keys = [
            "auto_message",
            "auto_message_expiration"
        ];

        // declare how to convert certain fields
        var key_types = [
            { key: "auto_message_expiration", "type": "integer" }
        ];

        var keys_to_change;

        // figure out whether we're updating the "whole object" or just some fields
        if(req.query.properties) {
            if(req.query.properties == 'basic') {
                keys_to_change = basic_keys;
            } else if(req.query.properties == 'self-help') {
                keys_to_change = extended_keys;
            } else if(req.query.properties == 'social') {
                keys_to_change = social_keys;
            } else if(req.query.properties == 'media') {
                keys_to_change = media_keys;
            } else if(req.query.properties == 'auto-message') {
                keys_to_change = auto_message_keys;
            } else {
                res.send('unrecognized field properties', 500);
                return;
            }

        } else {
            keys_to_change  = _.uniq(basic_keys.concat(extended_keys.concat(social_keys.concat(auto_message_keys.concat(media_keys)))));
        }

        // TODO: validate request body fields

        // massage video links (at the moment, only youtube)
        if(typeof(req.body['promo_videos']) != 'undefined') {
            req.body['promo_videos'] = general_util.normalizeYoutubeLinks(req.body['promo_videos']);
        }

        general_util.buildUpdateCommand(req.body, keys_to_change, key_types, function(err_build, update_value) {
            if(err_build) {
                res.send(err_build, 500);
                return;
            }

            var sets = update_value['$set'];
            var unsets = update_value['$unset'];

            sets = (sets ? sets : {});
            unsets = (unsets ? unsets : {});

            if(sets.name) {
                sets.name = general_util.removeHtmlFromString(sets.name);
            }

            // establish the "admin attributes" struct for the product
            sets.admin_attributes = {
                name: product.name,
                changed_by: caller._id
            };

            // prepare asynchronous processes
            var tasks = [], new_brand;

            if(_.keys(update_value).length == 0) {
                res.send('no update value provided', 500);
                return;
            }

            // change the brand if needed (flow is non-trivial)
            tasks.push(function(callback) {
                if(product.brand == req.body['brand'] || req.query.properties != 'basic') {
                    callback();
                    return;
                }

                product_util.changeProductBrand(product, req.body['brand'], false, function(err_change) {
                    callback(err_change);
                });
            });

            // update the product record
            tasks.push(function(callback) {

                database.ean.update({_id: ObjectID(id)}, update_value, function(err_update, update_result) {
                    if(err_update != null) {
                        callback(err_update);
                        return;
                    }
                    callback(err_update, update_result);
                });
            });

            // make sure SOLR record is up to date
            tasks.push(function(callback) {
                database.ean.findOne({_id: ObjectID(id)}, function(err_product, product) {
                    if (err_product != null) {
                        callback(err_product);
                        return;
                    }
                    solr.product_client.add(solr.generateProductRecord(product), function (err) { //, obj
                        if (err) {
                            winston.error(err);
                        }
                        callback(); // non-fatal on failure, as indexing process should catch it
                    });
                });
            });

            // run these async tasks, then phone home
            async.series(tasks, function(err_async, results_async) {
                if(err_async != null) {
                    res.send(err_async, 500);
                    return;
                }

                res.send(results_async, 200);
            });
        });
    });
}

function _productsTransferBrand(req, res) {
    var idList = req.param('idList');
    var idListTokens = idList.split(',');
    var brand_id = req.param('brand');

    async.series({

        'validate_product_ids': function(callback) {

            // validate each product id format
            var found_invalid = false;
            idListTokens.forEach(function(id) {
                if(!general_util.isValidId(id) && !found_invalid) {
                    found_invalid = true;
                    res.send('id ' + id + ' is not valid', 500);
                }
            });

            if(!found_invalid) {
                callback();
            }
        },

        'validate_brand': function(callback) {

            // validate brand id format
            if(!general_util.isValidId(brand_id)) {
                res.send('id ' + brand_id + ' is not valid', 500);
                return;
            }

            // make sure the brand exists
            database.pod_brands.findOne({_id: ObjectID(brand_id)}, function(err_brand, brand_result) {
                if(err_brand) {
                    res.send(err_brand, 500);
                    return;
                }

                if(!brand_result) {
                    general_util.send404(res, 'brand not found');
                    return;
                }

                callback();
            });
        }

    }, function() {

        var tasks = [];

        idListTokens.forEach(function(product_id) {
            tasks.push(function(callback) {
                database.ean.findOne({_id: ObjectID(product_id)}, function(err_product, product) {
                    if(err_product) {
                        callback(err_product);
                        return;
                    }

                    product_util.changeProductBrand(product, brand_id, true, function(err_transfer) {
                        callback(err_transfer);
                    });
                });
            });
        });

        async.series(tasks, function(err_tasks) {
            if(err_tasks) {
                res.send(err_tasks, 500);
                return;
            }
            res.send({'result': 'ok'}, 200);
        });
    });
}

function _productDelete(req, res) {
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    database.ean.findOne({_id: ObjectID(id)}, function(err_product, product) {
        if(err_product != null) {
            res.send(err_product, 500);
            return;
        }

        if(product == null) {
            res.send('not found', 500);
            return;
        }

        async.series({
            'product_remove': function(callback) {
                database.ean.remove({_id: ObjectID(id)}, function(err_remove, remove_result) {
                    if(err_remove != null) {
                        res.send(err_remove, 500);
                        return;
                    }
                    if(remove_result == 0) {
                        res.send('no records deleted', 500);
                        return;
                    }

                    callback(err_remove, remove_result);
                });
            },

            'product_totals': function(callback) {
                // recalculate brand count of old brand (if applicable)
                if(_.isUndefined(product.brand)) {
                    callback();
                    return;
                }

                var old_brand = {_id: ObjectID(product.brand)};
                brand_improve.fillInProductCount(old_brand, function() {
                    database.pod_brands.update({_id: old_brand._id}, {$set: {product_count: old_brand.product_count}}, function(err_update, update_result) {
                        callback(err_update, update_result);
                    });
                });
            },

            'solr_update': function(callback) {
                solr.product_client.deleteByID(id, function(err) { //, obj
                    if(err != null) {
                        winston.error('An error occurred when removing solr record: ' + err);
                    }
                    callback();
                });
            }
        }, function(err_async, results_async) {
            res.send({delete_count: results_async.product_remove}, 200);
        });
    });
}

function _mongoQuery(req, res) {
    var options = {};
    var term = req.query['ean_or_name'];
    var page = req.query['page'];
    var pageSize = req.query['pageSize'];

    var limit = 20;
    var skip = 0;
    var count = 0;

    var query = {
        $or: [{
            name: {$regex : ".*" + term + ".*", $options: 'i'}
        },{
            ean: {$regex : ".*" + term + ".*", $options: 'i'}
        }]
    };

    // figure out whether the term represents a name query or EAN/UPC query
    if(!eval(/^\d+$/).test(term)) {
        query.name = {$regex : ".*" + term + ".*", $options: 'i'};
    } else {
        query = {
            $or: [{
                name: {$regex : ".*" + term + ".*", $options: 'i'}
            },{
                ean: {$regex : ".*" + term + ".*", $options: 'i'}
            }]
        };
    }
    options.hint = {ean: 1, name: 1};

    async.series({

        'process_params': function(callback) {
            limit = (pageSize ? parseInt(pageSize) : 20);
            skip = (page ? parseInt(page) : 0);
           callback();
        },

        'count': function(callback) {
            if(!req.param('count')) {
                callback();
                return;
            }

            database.ean.find(query).count(function(err_count, count_result) {
                if(err_count) {
                    callback(err_count);
                    return;
                }
                count = count_result;
                callback();
            });
        },

        'search': function(callback) {
            database.ean.find(query, options).skip(skip).limit(limit).toArray(function(err_query, query_results) {
                if(err_query != null) {
                    res.send('an error occurred: ' + err_query, 500);
                    return;
                }

                var audit_record = audit_database.generateAuditRecord(req, {
                    'provider':     'mongo',
                    'text':         term,
                    'results':      query_results.length
                });

                audit_database.reportEvent('product_searches', audit_record);

                if(req.param('count')) {
                    res.send({products: query_results, count: count}, 200);
                    return;
                }
                res.send(query_results, 200);
            });
        }
    });
}

// source should be scan/search
function _reportProductGet(req, source, code, product, brand, found, participates) {
    var audit_record = audit_database.generateAuditRecord(req, {
        'source':       source,
        'code':         code,
        'found':        found,
        'participates': participates
    });
    if(product) {
        audit_record.product = product._id.toHexString();
        audit_record.product_name = product.name;
    }
    if(brand) {
        audit_record.brand = brand._id.toHexString();
        audit_record.brand_name = brand.name;
    }
    audit_database.reportEvent('product_queries', audit_record);
    return audit_record;
}

function _productWhereToBuy(req, res) {
    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);

    var ean = req.param('ean');

    winston.debug('processing where to buy request for product ' + ean);

    if(req.query['product-upc']) {
        res.send('please download a newer version of this application', 500);
        return;
    }

    product_util.getProductData(caller, ip, ean, false, function(err_product, product_info) {
        if(err_product) {
            res.send(err_product, 500);
            return;
        }

        if(!product_info || !product_info.product) {
            general_util.send404(res, 'product not found');
            return;
        }

        if(!product_info.brand) {
            res.send('brand not found', 500);
            return;
        }

        if(!product_info.brand.locator) {
            res.send('locator info not defined for brand', 500);
            return;
        }

        var ean = product_info.product.ean;

        // apply master EAN
        var ean_to_use = product_info.product.ean;
        if(product_info.product.master_ean && product_info.product.master_ean.locator) {
            ean_to_use = product_info.product.master_ean.locator;
        }

        var ean_without_check = ean_to_use.slice(0, ean_to_use.length - 1);
        var adjusted_upc = product_util.upc12ToUpc10(ean_to_use.slice(1, ean_to_use.length));

        var zip = req.query['zip'];
        var lat = req.query['lat'];
        var lon = req.query['lon'];
        var radius = req.query['radius'] ? req.query['radius'] : 20;
        var ip = general_util.getIPAddress(req);

        if(product_info.brand.locator.wilke) {
            var customer = product_info.brand.locator.wilke.customer;

            audit_database.reportEvent('where_to_buys', audit_database.generateAuditRecord(req, {
                'provider':     'wilke',
                'code':         ean,
                'brand':        product_info.brand ? product_info.brand._id.toHexString() : undefined,
                'brand_name':   product_info.brand ? product_info.brand.name : undefined,
                'ip':           ip,
                'geo': {
                    'zip':          zip,
                    'lat':          lat,
                    'lon':          lon,
                    'radius':       radius
                }
            }));

            winston.debug('requesting where to buy info from SPOT using ean ' + ean_without_check);
            wilke.locateProduct(caller, ean_without_check, customer, zip, lat, lon, radius, ip, req.headers.referer, function(err_locate, locate_result) {
                if(err_locate) {
                    res.send(err_locate, 500);
                    return;
                }
                res.send(locate_result, 200);
            });
            return;
        }
        if(product_info.brand.locator.iri) {

            // record the request for auditing/reporting
            var audit_record = audit_database.generateAuditRecord(req, {
                'provider':     'iri',
                'code':         ean,
                'brand':        product_info.brand ? product_info.brand._id.toHexString() : undefined,
                'brand_name':   product_info.brand ? product_info.brand.name : undefined,
                'ip':           ip,
                'geo': {
                    'zip':          zip,
                    'radius':       radius
                }
            });
            audit_database.reportEvent('where_to_buys', audit_record);

            // make the request
            var iri_client = product_info.brand.locator.iri.client;
            var iri_brand = product_info.brand.locator.iri.brand;

            var additional_headers = {
                'host':             req.header('host'),
                'referer':          req.header('referer'),
                'user-agent':       req.header('user-agent'),
                'X-Forwarded-For':  ip
            };

            var optional_query = {};
            if(radius) {
                optional_query.searchradius = radius;
            }

            winston.debug('requesting where to buy info from IRI using ean ' + adjusted_upc);

            iri.locateProductFromUPC({
                client_id: iri_client,
                brand_id: iri_brand,
                upc10: adjusted_upc,
                zip: zip
            }, optional_query, additional_headers, function(err_locate, locate_result) {
                if(err_locate) {
                    res.send(err_locate, 500);
                    return;
                }

                res.send(locate_result, 200);
            });
            return;
        }
        if(product_info.brand.locator.google){
          res.send("",200);
          return;
        }
        res.send('we’re sorry, but we have no information available on this product', 500);
    });
}
