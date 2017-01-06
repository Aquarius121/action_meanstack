var _ = require('underscore');
var async = require('async');
var cheerio = require('cheerio');
var request = require('request');
var winston = require('winston');

var event_processing = require('./../event-processing');
var general_utils = require('./general-utils');
var user_util = require('./user-utils');

var cache_database = require('./../database/instances/action-cache');

var STANDARD_VIEW = '3570588';
var LIVE_REQUESTS = true;
var ALLOW_ADDITIONAL_REQUESTS = true;

var DOC_TYPES = {
    CATEGORY_LIST:  '3733818',
    CATEGORY:       '3570626',
    PRODUCT_TYPE:   '4142415',
    SPOT:           'spot',
    DOCUMENT:       'doc'
};

module.exports = {
    getEnlightDocument: _enlightGetDocument,
    searchEnlight: _enlightSearch,

    getEnlightProductByUPC: _enlightGetProduct,

    locateProduct: _locateProduct,
    mergeProductInfo: _mergeProductInfo,

    DOC_TYPES: DOC_TYPES,

    STANDARD_VIEW: STANDARD_VIEW
};

var event_bucket = new event_processing.KeyedEventBucket(cache_database.wilke_documents);

function _enlightSearch(options_in) {

    var default_options = {
        caller: null,
        tenant: null,
        docType: null,
        view: null,
        q2: null,
        q3: null,
        ip: null,
        live_requests: true,
        callback2: function() {}
    };

    var options = _.extend(_.clone(default_options), options_in);

    if(options.live_requests) {
        var url = 'https://enlight1.crsondemand.com/scripts/cgiip.exe/WService=enlight/' +
            options.tenant + '/kb/' + options.view + '/_search' +
            '?remoteAddr=' + options.ip +
            (options.docType ? ('&docType=' + options.docType) : '') +
            '&visitorId=' + (options.caller ? options.caller._id : (new Date().getTime())) +
            '&output=json' +
            (options.q2 ? '&q2=' + options.q2 : '') +
            (options.q3 ? '&q3=' + options.q3 : '');

        winston.debug('querying Wilke Enlight: ' + url);

        var headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Referer': 'theactionapp.com'
        };

        _makeRequestAndParseBody(url, headers, 'Wilke Enlight search "' + options.q2 + '" on ' + options.docType, function(err_parse, parse_result) {
            if(err_parse) {
                winston.error('failed to parse Wilke Enlight search response: ' + err_parse);
            }

            // if we get crap or errors from wilke, try our local data
            if(err_parse || _.keys(parse_result).length == 0) {
                winston.warn('wilke enlight did not return usable results, so serving from cache');
                cache_database.wilke_documents.findOne({type: options.docType, query: options.q2}, function(err_fallback, fallback_result) {
                    options.callback2(err_fallback, fallback_result);
                });
                return;
            }
            _reportDocument(options.docType, options.q2, parse_result);
            options.callback2(err_parse, parse_result);
        });
        return;
    }

    cache_database.wilke_documents.findOne({type: options.docType, query: options.query}, function(err_fallback, fallback_result) {
        options.callback2(err_fallback, fallback_result);
    });
    //http://enlight1.crsondemand.com/scripts/cgiip.exe/WService=enlight/nes/kb/3570588/_search?docType=4142415&output=json&q=2800024640
}

function _enlightGetDocument(caller, tenant, document_id, view, ip, is_parsing, callback2) {
    if(LIVE_REQUESTS) {
        var url = 'https://enlight1.crsondemand.com/scripts/cgiip.exe/WService=enlight/' +
            tenant + '/w/public/viewer/kbDoc.w' +
            '?view=' + view +
            '&doc=' + document_id +
            '&remoteAddr=' + ip +
            '&visitorId=' + (caller ? caller._id : (new Date().getTime())) +
            '&output=json';

        winston.debug('getting enlight document ' + document_id + ' for tenant ' + tenant);

        var headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Referer': 'theactionapp.com'
        };

        if(is_parsing) {
            _makeRequestAndParseBody(url, headers, 'Wilke Enlight document ' + document_id, function (err_parse, parse_result) {
                if(err_parse) {
                    winston.error('failed to parse Wilke Enlight document response: ' + err_parse);
                }

                // if we get crap or errors from wilke, try our local data
                if (err_parse || !parse_result) {
                    winston.warn('wilke enlight did not return usable results, so serving from cache');
                    cache_database.wilke_documents.findOne({type: DOC_TYPES.DOCUMENT, query: document_id}, function(err_fallback, fallback_result) {
                        callback2(err_fallback, fallback_result);
                    });
                    return;
                }
                _reportDocument(DOC_TYPES.DOCUMENT, document_id, parse_result);
                callback2(err_parse, parse_result);
            });
        } else {
            _makeRequest(url, headers, 'Wilke Enlight document ' + document_id, function (err_load, response_result) {
                if(err_load) {
                    winston.error('failed to parse Wilke Enlight document response: ' + err_load);
                }

                // if we get crap or errors from wilke, try our local data
                if (err_load || !response_result) {
                    winston.warn('wilke enlight did not return usable results, so serving from cache');
                    cache_database.wilke_documents.findOne({type: DOC_TYPES.DOCUMENT, query: document_id}, function(err_fallback, fallback_result) {
                        callback2(err_fallback, fallback_result);
                    });
                    return;
                }

                callback2(err_load, response_result);
            });
        }

        return;
    }
    cache_database.wilke_documents.findOne({type: DOC_TYPES.DOCUMENT, query: document_id}, function(err_fallback, fallback_result) {
        callback2(err_fallback, fallback_result);
    });
}

function _enlightGetProduct(caller, tenant, docTypeId, view, upc, ip, callback2) {
    _enlightSearch(
        {
            caller: caller,
            tenant: tenant,
            doctype: docTypeId,
            view: view,
            q2: upc,
            ip:ip,
            callback2: function(err_category, category_result) {
                if(err_category) {
                    callback(err_category);
                    return;
                }
                // so we have the product mapping, now get the document
                if(category_result && category_result.rows && category_result.rows.length > 0) { //TODO: STANDARD_VIEW LOOKS WRONG
                    _enlightGetDocument(caller, tenant, category_result.rows[0].code, STANDARD_VIEW, ip, true, function(err_document, document_result) {
                        if(err_document) {
                            callback(err_document);
                            return;
                        }

                        // TODO: perhaps get documents for any kb?doc=XXXXXXX values
                        callback2(null, document_result);
                    });
                    return;
                }
                callback2(null, null);
            }
    });
}

function _locateProduct(caller, product_upc, customer, zip, lat, lon, radius, ip, referer, callback2) {
    var base_url = 'http://www2.itemlocator.net/ils/locatorJSON/?' +
        'item=' + product_upc +
        '&remoteAddr=' + ip +
        '&visitorId=' + (caller ? caller._id : (new Date().getTime())) +
        '&customer=' + customer +
        '&radius=' + radius;

    base_url += (zip ? "&zip=" + zip : '');

    // we're also making a document-url, which is less precise when using lat/lon than actual queries
    // this effectively "rounds down" to some ratio of a degree
    var document_url = base_url;
    if(lat && lon) {
        try {
            document_url += "&lat=" + parseFloat(lat).toFixed(1); // latitude is about 69 miles per degree, so this is at most 6.9 mi?
            document_url += "&long=" + parseFloat(lon).toFixed(1);
        } catch(ex) {
            document_url += "&lat=" + lat;
            document_url += "&long=" + lon;
        }
    }

    if(LIVE_REQUESTS) {
        var url = base_url;

        url += (lat ? "&lat=" + lat : '');
        url += (lon ? "&long=" + lon : '');

        winston.debug('querying Wilke SPOT for "' + url + '" of type ' + 'location' + ' for customer ' + customer);

        var headers = {
        //    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Referer': 'theactionapp.com'
        };

        // Wilke keeps a list of valid referrers, so we can't just use the one that comes from the user
        if(referer) {
        //    headers['Referer'] = referer;
        }

        _makeRequestAndParseBody(url, headers, 'Wilke SPOT search ' + url, function(err_parse, parse_result) {
            if(err_parse) {
                winston.error('failed to parse Wilke Enlight locate product response: ' + err_parse);
            }

            // if we get crap or errors from wilke, try our local data
            if(err_parse || _.keys(parse_result).length == 0) {
                winston.warn('wilke SPOT did not return usable results, so serving from cache');
                cache_database.wilke_documents.findOne({type: DOC_TYPES.SPOT, query: document_url}, function(err_fallback, fallback_result) {
                    callback2(err_fallback, fallback_result);
                });
                return;
            }
            _reportDocument(DOC_TYPES.SPOT, document_url, parse_result);
            callback2(err_parse, parse_result);
        });
        return;
    }

    cache_database.wilke_documents.findOne({type: DOC_TYPES.SPOT, query: document_url}, function(err_fallback, fallback_result) {
        callback2(err_fallback, fallback_result);
    });
}

function _getUrlFromProperty(value) {
    var $ = cheerio.load(value, {
        normalizeWhitespace: true
    });
    var a = $('a');
    if(a.length == 0 || a[0].children.length == 0) {
        return value;
    }

    if(a[0].attribs['href']) {
        return a[0].attribs['href'];
    }

    return a[0].children[0].data;
}

function _mergeProductInfo(caller, ip, product_info, wilke_data, wilke_config, callback2) {
    if(wilke_data.fields) {

        // TODO: process faqkeywords, parentean?

        if(wilke_data.fields['brandmessage']) {
            product_info.product.brand_message = wilke_data.fields['brandmessage'].trim().length > 0 ? wilke_data.fields['brandmessage'] : product_info.product.brand_message;
        }
        if(wilke_data.fields['phonenumber']) {
            product_info.product.phone_number = wilke_data.fields['phonenumber'].trim().length > 0 ? wilke_data.fields['phonenumber'] : product_info.product.phone_number;
        }
        if(wilke_data.fields['smsnumber']) {
            product_info.product.sms_number = wilke_data.fields['smsnumber'].trim().length > 0 ? wilke_data.fields['smsnumber'] : product_info.product.sms_number;
        }
        if(wilke_data.fields['prodingredients']) {
            product_info.product.ingredients = wilke_data.fields['prodingredients'].trim().length > 0 ? wilke_data.fields['prodingredients'] :  product_info.product.ingredients;
        }
        if(wilke_data.fields['auto_message']) {
            product_info.product.auto_message = wilke_data.fields['auto_message'].trim().length > 0 ? wilke_data.fields['auto_message'] :  product_info.product.auto_message;
        }
        if(wilke_data.fields['prodinstructions']) {
            product_info.product.instructions = wilke_data.fields['prodinstructions'].trim().length > 0 ? wilke_data.fields['prodinstructions'] : product_info.product.instructions;
        }

        async.series({

            'facebook_url': function(callback) {
                if(wilke_data.fields['facebookurl'] && wilke_data.fields['facebookurl'].trim().length == 0) {
                    callback();
                    return;
                }

                product_info.product.facebook_link = _getUrlFromProperty(wilke_data.fields['facebookurl']);
                callback();
            },

            'instagramurl': function(callback) {
                if(wilke_data.fields.instagramurl && wilke_data.fields.instagramurl.trim().length == 0) {
                    callback();
                    return;
                }

                product_info.product.instagram_link = _getUrlFromProperty(wilke_data.fields.instagramurl);
                callback();
            },

            'twitterurl': function(callback) {
                if(wilke_data.fields.twitterurl && wilke_data.fields.twitterurl.trim().length == 0) {
                    callback();
                    return;
                }

                product_info.product.twitter_link = _getUrlFromProperty(wilke_data.fields.twitterurl);
                callback();
            },

            'promo_videos': function(callback) {
                if(wilke_data.fields['prodvideourl'] && wilke_data.fields['prodvideourl'].trim().length == 0) {
                    callback();
                    return;
                }

                product_info.product.promo_videos = [_getUrlFromProperty(wilke_data.fields['prodvideourl'])];
                product_info.product.promo_videos = general_utils.normalizeYoutubeLinks(_.filter(product_info.product.promo_videos, function(url) {
                    return !url ? false : url.trim().length > 0;
                }));
                callback();
            },

            'prodlabel': function(callback) {
                if(!ALLOW_ADDITIONAL_REQUESTS) {
                    callback();
                    return;
                }
                if(wilke_data.fields['prodlabel'] && wilke_data.fields['prodlabel'].trim().length == 0) {
                    callback();
                    return;
                }
                if(wilke_data.fields['prodlabel'].indexOf('kb?doc=') == -1) {
                    callback();
                    return;
                }
                var doc_id = parseInt(wilke_data.fields['prodlabel'].substr(7));
                if(isNaN(doc_id)) {
                    callback();
                    return;
                }

                winston.debug('getting product label from enlight for ' + product_info.product.ean);

                _enlightGetDocument(caller, wilke_config.customer, doc_id, wilke_config.view_id, ip, false, function(error_doc, document) {
                    if(error_doc) {
                        callback(error_doc);
                        return;
                    }

                    if(document) {
                        var img_data = 'data:image/jpeg;charset=utf-8;base64,' + document.toString('base64');

                        if(product_info.product.images) {
                            product_info.product.images.push(img_data);
                        } else {
                            product_info.product.images = [img_data];
                        }
                        winston.debug('applied product image document to ' + product_info.product.ean);
                    }
                    callback();
                });
            },

            'prodnutrition': function(callback) {
                if(!ALLOW_ADDITIONAL_REQUESTS) {
                    callback();
                    return;
                }
                if(wilke_data.fields['prodnutrition'] && wilke_data.fields['prodnutrition'].trim().length == 0) {
                    callback();
                    return;
                }
                if(wilke_data.fields['prodnutrition'].indexOf('kb?doc=') == -1) {
                    callback();
                    return;
                }
                var doc_id = parseInt(wilke_data.fields['prodnutrition'].substr(7));
                if(isNaN(doc_id)) {
                    callback();
                    return;
                }

                winston.debug('getting nutrition label from enlight for ' + product_info.product.ean);

                _enlightGetDocument(caller, wilke_config.customer, doc_id, wilke_config.view_id, ip, false, function(error_doc, document) {
                    //product_info.product.nutrition_labels = ['<img src="data:image/jpeg;charset=utf-8;base64,' + document.toString('base64') + '">'];
                    winston.debug('applied nutrition label document to ' + product_info.product.ean);
                    callback();
                });
            }

        }, function() {
            callback2();
        });

        /*
            mapsearchtypes
            prodcategory
            proddescription

             //prodnutrition = "kb?doc=4143374"
             //prodinstructions = ""
             //prodlabel = "kb?doc=4143108"
         */
        return;
    }
    callback2();
}

function _makeRequest(url, headers, description, callback2) {
    var body_buffer = new Buffer(0);

    request({
        url: url,
        method: 'GET',
        headers: headers
    }).on('data', function (chunk) { // .pipe(zlib.createGunzip())
        body_buffer = Buffer.concat([body_buffer, chunk]);
    }).on('end', function() {
        callback2(null, body_buffer);
    }).on('error', function(err) {
        winston.error('Failed to load ' + description + ' for url ' + url);
        callback2(err);
    });
}


function _makeRequestAndParseBody(url, headers, description, callback2) {
    var body = "";

    request({
        url: url,
        method: 'GET',
        headers: headers
    }).on('data', function (chunk) { // .pipe(zlib.createGunzip())
        body += chunk;
    }).on('end', function() {
        try {
            if(body.length > 0) {
                var body_as_string = JSON.parse(body);
                callback2(null, body_as_string);
                return;
            }
        } catch(ex) {
            winston.error('could not parse response from ' + description);
            callback2('could not parse response from ' + description);
            return;
        }

        callback2(null, {});
    }).on('error', function(err) {
        winston.error('Failed to load ' + description + ' for url ' + url);
        callback2(err);
    });
}

function _reportDocument(type, query, document) {
    general_utils.runInBackground(function() {
        event_bucket.report({type: type, query: query}, document);
    });
}

general_utils.runWhenDbLoaded(cache_database.db, _processEvents);

function _processEvents() {
    setTimeout(function() {
        event_bucket.process(function() { // err_process, process_result
            setTimeout(_processEvents, 5000);
        });
    }, 5000);
}

// https://enlight1.crsondemand.com/scripts/cgiip.exe/WService=enlight/nes/w/public/viewer/kbDoc.w?view=3570588&doc=4143254&output=json