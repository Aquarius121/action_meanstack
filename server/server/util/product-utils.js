var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var action_database = require('../database/instances/action');
var astute_knowledge = require('astute-knowledge-sdk');
var database = require('../database/instances/product-info');
var solr = require('../solr');
var wilke = require('../util/wilke-utils');

var brand_improve = require('./brand-improve');
var brand_util = require('./brand-utils');
var general_util = require('./general-utils');
var user_util = require('./user-utils');

module.exports = {

    getProductData: _getProduct,
    getProductsByIds: _getProductsByIds,
    isParticipating: _isParticipating,
    upc12ToUpc10: _upc12ToUpc10,
    computeCheckDigit: _computeCheckDigit,
    mergeProducts: _mergeProducts,
    changeProductBrand: _changeProductBrand

};

// gets the product, associated brand, and brand's favorite status for the given caller
function _getProduct(caller, ip, code, allow_tp_api_calls, callback2) {
    var query = {};

    if(code.length != 12 && code.length != 13 && code.length != 8) {
        callback2('unrecognized code format');
        return;
    }

    switch(code.length) {
        case 12:
            query.upc = code;
            break;
        case 8:
        case 13:
            query.ean = code;
            break;
    }

    var fields = {
        _id: 1,
        brand: 1,
        brand_name: 1,
        ean: 1,
        images: 1,
        promo_images: 1,
        name: 1,
        upc: 1,

        ingredients: 1,
        instructions: 1,
        nutrition_labels: 1,
        promo_videos: 1,
        brand_message: 1,
        feature_weight: 1,
        master_ean: 1,

        faq: 1,
        auto_message: 1,
        auto_message_expiration: 1,
        map_search_types: 1,
        facebook_link: 1,
        instagram_link: 1,
        twitter_link: 1,
        phone_number: 1,
        sms_number: 1,
        image_style: 1
    };

    database.ean.findOne(query, fields, function(err, product) {
        if(err != null) {
            winston.error('an error occurred while getting product info: ' + err);
            callback2(err);
            return;
        }

        if(!product) {
            callback2(err, product);
            return;
        }

        // figure out which EAN to query from this point forward (account for master EAN)
        var ean_to_use = product.ean;
        if(product.master_ean && product.master_ean.product_info) {
            ean_to_use = product.master_ean.product_info;
        }

        // this is the eventual data we'd like to send back with the response
        var data = {
            product: product
        };

        async.series({

            // grab the brand for the product
            'brand': function(callback) {
                if(!product.brand) {
                    callback();
                    return;
                }
                brand_util.getBrandData(caller, product.brand, function(err_brand, brand) {
                    data.brand = brand;
                    callback();
                });
            },

            // grab the master product for the given product, if it exists
            'master_product': function(callback) {
                if(!product.master_ean || !product.master_ean.product_info) {
                    callback();
                    return;
                }

                database.ean.findOne({
                    ean: product.master_ean.product_info
                }, fields, function(err, master_product) {
                    if(err) {
                        callback(err);
                        return;
                    }
                    if(!master_product) {
                        callback();
                        return;
                    }

                    // "merge" master into product
                    _mergeProducts(product, master_product);

                    callback();
                });
            },

            // apply product info from Wilke Enlight to the given product, if needed
            'wilke_data': function(callback) {
                if(!allow_tp_api_calls) {
                    callback();
                    return;
                }

                if(!data.brand) {
                    callback();
                    return;
                }

                if(!data.brand.product_info_source || !data.brand.product_info_source.wilke) {
                    callback();
                    return;
                }

                var customer = data.brand.product_info_source.wilke.customer;
                if(!customer || customer.trim().length == 0) {
                    winston.error('wilke customer was not defined when looking up product info');
                    callback();
                    return;
                }

                var adjusted_upc = _upc12ToUpc10(ean_to_use.slice(1, ean_to_use.length - 1));
                var ean_without_check = ean_to_use.slice(0, ean_to_use.length - 1);

                wilke.getEnlightProductByUPC(caller,
                    data.brand.product_info_source.wilke.customer,
                    data.brand.product_info_source.wilke.doc_type_id,
                    data.brand.product_info_source.wilke.view_id,
                    ean_without_check,
                    ip,
                    function(err_wilke, wilke_data) {
                        if(err_wilke) {
                            winston.warn('no wilke data found for upc ' + product.upc + '(' + ean_without_check + ')');
                            callback(); // NOTE: non-fatal
                            return;
                        }

                        if(!wilke_data) {
                            wilke.getEnlightProductByUPC(caller,
                                data.brand.product_info_source.wilke.customer,
                                data.brand.product_info_source.wilke.doc_type_id,
                                data.brand.product_info_source.wilke.view_id,
                                adjusted_upc,
                                ip,
                                function(err_wilke2, wilke_data2) {
                                    if(err_wilke2) {
                                        winston.warn('no wilke data found for upc ' + product.upc + '(' + adjusted_upc + ')');
                                        callback(); // NOTE: non-fatal
                                        return;
                                    }

                                    if(!wilke_data2) {
                                        callback(); // NOTE: non-fatal
                                        return;
                                    }

                                    wilke.mergeProductInfo(caller, ip, data, wilke_data2, data.brand.product_info_source.wilke, function() { // err_merge, merge
                                        callback();
                                    });
                                }
                            );
                            return;
                        }

                        wilke.mergeProductInfo(caller, ip, data, wilke_data, data.brand.product_info_source.wilke, function() { // err_merge, merge
                            callback();
                        });
                    }
                );
            },

            // apply product info from Astute knowledge version 5 to the product, if needed
            'astute_knowledge_5': function(callback) {
                if(!allow_tp_api_calls) {
                    callback();
                    return;
                }

                if(!data.brand) {
                    callback();
                    return;
                }

                if(!data.brand.product_info_source || !data.brand.product_info_source.astute_knowledge_5) {
                    callback();
                    return;
                }

                // TODO: validate ak_5 config

                astute_knowledge.getProductInfo5(data.brand.product_info_source.astute_knowledge_5, ean_to_use, function(err_product, product_result) {

                    if(err_product) {
                        winston.warn('no astute knowledge 5 data found for upc ' + product.upc + '(' + ean_to_use + ')');
                        callback(); // NOTE: non-fatal
                        return;
                    }

                    if(!product_result) {
                        callback(); // NOTE: non-fatal
                        return;
                    }

                    _.each(_.keys(product_result), function(key) {
                        if(key.toLowerCase() == 'ingredients') {
                            data.product.ingredients = product_result[key].trim();
                            return;
                        }
                        if(key.toLowerCase() == 'instructions') {
                            data.product.instructions = product_result[key].trim();
                            return;
                        }
                        if(key.toLowerCase() == 'label') {
                            data.product.nutrition_labels = [product_result[key].trim()];
                            return;
                        }
                        if(key.toLowerCase() == 'message') {
                            data.product.brand_message = product_result[key].trim();
                            return;
                        }
                        if(key.toLowerCase() == 'video') {
                            data.product.promo_videos = [product_result[key].trim()];
                            data.product.promo_videos = general_util.normalizeYoutubeLinks(data.product.promo_videos);
                            return;
                        }
                    });

                    callback();
                });
            },

            // apply product info from Astute knowledge version 6+ to the product, if needed
            'astute_knowledge': function(callback) {
                if(!allow_tp_api_calls) {
                    callback();
                    return;
                }

                if(!data.brand) {
                    callback();
                    return;
                }

                if(!data.brand.product_info_source || !data.brand.product_info_source.astute_knowledge) {
                    callback();
                    return;
                }

                // TODO: validate ak config

                astute_knowledge.getProductInfo67(data.brand.product_info_source.astute_knowledge, ean_to_use, function(err_product, product_result) {

                    if(err_product) {
                        winston.warn('no astute knowledge 6+ data found for upc ' + product.upc + '(' + ean_to_use + '): ' + err_product);
                        callback(); // NOTE: non-fatal
                        return;
                    }

                    if(!product_result) {
                        callback(); // NOTE: non-fatal
                        return;
                    }

                    _.each(_.keys(product_result), function(key) {
                        if(key.toLowerCase() == 'action_image') {
                            var img_result = product_result[key];

                            data.product.images = [];
                            if(Array.isArray(img_result)) {
                                img_result.forEach(function(src) {
                                    data.product.images.push(src);
                                });
                                return;
                            }

                            data.product.images = [img_result];
                            return;
                        }
                        if(key.toLowerCase() == 'action_ingredients') {
                            data.product.ingredients = product_result[key].trim();
                            return;
                        }
                        if(key.toLowerCase() == 'action_instructions') {
                            data.product.instructions = product_result[key].trim();
                            return;
                        }
                        if(key.toLowerCase() == 'action_label') {
                            data.product.nutrition_labels = [product_result[key].trim()];
                            return;
                        }
                        if(key.toLowerCase() == 'action_message') {
                            data.product.brand_message = product_result[key].trim();
                            return;
                        }
                        if(key.toLowerCase() == 'action_video') {
                            var video_result = product_result[key];

                            if(Array.isArray(video_result)) {
                                data.product.promo_videos = [];

                                video_result.forEach(function(src) {
                                    data.product.promo_videos.push(src);
                                });
                                data.product.promo_videos = _.uniq(general_util.normalizeYoutubeLinks(data.product.promo_videos));
                                return;
                            }

                            data.product.promo_videos = [product_result[key].trim()];
                            data.product.promo_videos = general_util.normalizeYoutubeLinks(data.product.promo_videos);
                            return;
                        }
                    });

                    callback();
                });
            },

            // we'd like to attach to the product and brand whether or not the user has faved/opted into them
            'favorite': function(callback) {
                if(!product.brand) {
                    callback();
                    return;
                }

                if(!caller) {
                    callback();
                    return;
                }

                user_util.getSafeUserById(action_database.user_account, caller, caller._id,
                    function(err_user) {
                        callback(err_user);
                    },
                    function(user) {
                        var brand_favorite = _.findWhere(user.favorites, {brand: product.brand});
                        if(brand_favorite) {
                            data.brand.favorite = brand_favorite;
                        }
                        var brand_opt = _.findWhere(user.opt_ins, {brand: product.brand});
                        if(brand_opt) {
                            data.brand.opt = brand_opt;
                        }

                        var product_favorite = _.findWhere(user.favorites, {product: product._id.toHexString()});
                        if(product_favorite) {
                            data.product.favorite = product_favorite;
                        }
                        var product_opt = _.findWhere(user.opt_ins, {product: product._id.toHexString()});
                        if(product_opt) {
                            data.product.opt = product_opt;
                        }

                        callback();
                    }
                );
            }

        }, function(err_async) { // , async_results
            callback2(err_async, data);
        });
    });
}

function _changeProductBrand(product, brand_id, shall_update_solr, callback2) {

    var new_brand, tasks = [];

    // find the new brand and associate the brand name
    tasks.push(function(callback) {

        // if the product currently exist in this brand, just exit the method
        if(product.brand == brand_id) {
            callback2();
            return;
        }

        if(!brand_id) {
            callback();
            return;
        }

        database.pod_brands.findOne({_id: ObjectID(brand_id)}, function(err_brand, brand) {
            if(err_brand != null) {
                callback2(err_brand);
                return;
            }

            if(!brand) {
                callback2('brand not found');
                return;
            }

            product['brand_name'] = brand.name;
            new_brand = brand;

            callback();
        });
    });

    // update product record
    tasks.push(function(callback) {

        var update_value = {};

        if(!brand_id) {
            update_value['$unset'] = {
                brand: 1,
                brand_name: 1
            };
        } else {
            update_value['$set'] = {
                brand: brand_id,
                brand_name: new_brand.name
            };
        }

        database.ean.update({_id: product._id}, update_value, function(err_update, update_result) {
            if(err_update != null) {
                callback(err_update);
                return;
            }
            callback(err_update, update_result);
        });
    });

    // recalculate brand count of old brand (if applicable)
    tasks.push(function(callback) {
        if(!product.brand) {
            callback();
            return;
        }

        var old_brand = {_id: ObjectID(product.brand)};
        brand_improve.fillInProductCount(old_brand, function() {
            database.pod_brands.update({_id: old_brand._id}, {$set: {product_count: old_brand.product_count}}, function(err_update, update_result) {
                callback(err_update, update_result);
            });
        });
    });

    // recalculate brand count of new brand (if applicable)
    tasks.push(function(callback) {
        if(!new_brand) {
            callback();
            return;
        }

        brand_improve.fillInProductCount(new_brand, function() {
            database.pod_brands.update({_id: new_brand._id}, {$set: {product_count: new_brand.product_count}}, function(err_update, update_result) {
                callback(err_update, update_result);
            });
        });
    });

    if(shall_update_solr) {

        tasks.push(function(callback) {
            solr.product_client.add(solr.generateProductRecord(product), function (err) { //, obj
                if (err) {
                    winston.error(err);
                }
                callback(); // non-fatal on failure, as indexing process should catch it
            });
        });
    }

    async.series(tasks, callback2);
}

// TODO: maybe trim in comparison?
function _mergeProducts(product, master_product) {
    product.brand_message = (master_product.brand_message ? master_product.brand_message : product.brand_message);
    product.phone_number = (master_product.phone_number ? master_product.phone_number : product.phone_number);
    product.sms_number = (master_product.sms_number ? master_product.sms_number : product.sms_number);
    product.ingredients = (master_product.ingredients ? master_product.ingredients : product.ingredients);
    product.auto_message = (master_product.auto_message ? master_product.auto_message : product.auto_message);
    product.instructions = (master_product.instructions ? master_product.instructions : product.instructions);
    product.facebook_link = (master_product.facebook_link ? master_product.facebook_link : product.facebook_link);
    product.instagram_link = (master_product.instagram_link ? master_product.instagram_link : product.instagram_link);
    product.twitter_link = (master_product.twitter_link ? master_product.twitter_link : product.twitter_link);
    product.faq = (master_product.faq ? master_product.faq : product.faq);
    product.promo_videos = (master_product.promo_videos ? master_product.promo_videos : product.promo_videos);
    product.images = (master_product.images ? master_product.images : product.images);
    product.nutrition_labels = (master_product.nutrition_labels ? master_product.nutrition_labels : product.nutrition_labels);
}

// fields param is optional
function _getProductsByIds(idList, fields, callback) {
    if(idList.length == 0) {
        callback(null, []);
        return;
    }

    if(!fields) {
        fields = {
            _id: 1,
            brand: 1,
            brand_name: 1,
            ean: 1,
            name: 1,
            upc: 1,
            images: 1
        };
    }

    idList = _.map(idList, function(id) { return ObjectID(id);});
    database.ean.find({_id: {$in: idList}}, fields).toArray(callback);
}

function _isParticipating(product_info) {

    if(!!product_info.brand && product_info.brand.name == "Bullpen")
        return true;
    else
        return (!!product_info.brand && !!product_info.brand.crm_email_endpoint);
}

function _upc12ToUpc10(upc12) {
    if(upc12.length == 12) {
        return upc12.substring(1, 11);
    }
    return upc12;
}

// http://en.wikipedia.org/wiki/Check_digit
function _computeCheckDigit(upc) {
    var i= 0, sum = 0;
    for(;i<upc.length; i+=2) {
        sum += parseInt(upc[i]);
    }
    sum *= 3;
    for(i=1;i<upc.length; i+=2) {
        sum += parseInt(upc[i]);
    }

    return (sum % 10 == 0 ? 0 : 10 - (sum % 10));
}