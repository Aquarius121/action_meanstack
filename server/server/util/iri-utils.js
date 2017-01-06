var _ = require('underscore');
var request = require('request');
var winston = require('winston');
var xml2js = require('xml2js').parseString;

module.exports = {
    getProductList: _getProductList,
    getProductGroups: _getProductGroups,
    getProductsFromGroup: _getProductsFromGroup,
    locateProductFromUPC: _locateProductFromUPC,
    locateProductGroup: _locateProductGroup
};

function _getProductList(client_id, brand_id, additional_header_fields, callback2) {
    var url = 'http://productlocator.infores.com/productlocator/products/products.pli?';
    url += 'client_id=' + client_id;
    url += '&brand_id=' + brand_id;

    var headers = {
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive'
    };
    if(additional_header_fields) {
        headers = _.extend(headers, additional_header_fields);
    }
    //http://productlocator.infores.com/productlocator/products/products.pli?client_id=10&brand_id=UNIL

    var body = "";

    request({
        url: url,
        method: 'GET',
        headers: headers
    }).on('data', function (chunk) { // .pipe(zlib.createGunzip())
        body += chunk;
    }).on('end', function() {
        try {
            xml2js(body, function(err_xml, xml_data) {
                if(err_xml) {
                    winston.error('failed to parse IRI product list response: ' + err_xml);
                    callback(err_xml);
                    return;
                }

                if(xml_data && xml_data.products) {

                    // check for errors
                    if(xml_data.products.error) {
                        winston.error('while getting IRI product list response: ' + xml_data.products.error.message);
                        callback(xml_data.products.error.message);
                        return;
                    }

                    if(!xml_data.products.product) {
                        callback(null, []);
                        return;
                    }

                    _.each(xml_data.products.product, function(product) {
                        // TODO: process
                        winston.debug(product);
                    });
                    callback2(null, xml_data.products.product);
                    return;
                }
                callback2(null, []);
            });
        } catch(ex) {
            winston.error('could not parse response from IRI _getProductList where client_id = ' + client_id + ' and brand_id = ' + brand_id);
            callback2('could not parse response from IRI _getProductList where client_id = ' + client_id + ' and brand_id = ' + brand_id);
        }
    }).on('error', function(err) {
        winston.error('Failed to load IRI _getProductList for url ' + url);
        callback2(err);
    });
}

function _getProductGroups(client_id, brand_id, additional_header_fields, callback2) {

    var url = 'http://productlocator.infores.com/productlocator/products/products.pli?';
    url += 'client_id=' + client_id;
    url += '&brand_id=' + brand_id;
    url += '&prod_lvl=group';

    var headers = {
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive'
    };
    if(additional_header_fields) {
        headers = _.extend(headers, additional_header_fields);
    }
    //http://productlocator.infores.com/productlocator/products/products.pli?client_id=11&brand_id=NSTL&prod_lvl=group

    var body = "";

    request({
        url: url,
        method: 'GET',
        headers: headers
    }).on('data', function (chunk) { // .pipe(zlib.createGunzip())
        body += chunk;
    }).on('end', function() {
        try {
            xml2js(body, function(err_xml, xml_data) {
                if(err_xml) {
                    winston.error('failed to parse IRI product group response: ' + err_xml);
                    callback(err_xml);
                    return;
                }

                if(xml_data && xml_data['groups']) {

                    // check for errors
                    if(xml_data['groups'].error) {
                        callback(xml_data['groups'].error.message);
                        return;
                    }

                    if(!xml_data['groups'].group) {
                        callback(null, []);
                        return;
                    }

                    _.each(xml_data['groups'].group, function(group) {
                        winston.debug(group);
                        // TODO: process
                    });
                    callback2(null, xml_data['groups'].group);
                    return;
                }
                callback2(null, []);
            });
        } catch(ex) {
            winston.error('could not parse response from IRI _getProductGroups where client_id = ' + client_id + ' and brand_id = ' + brand_id);
            callback2('could not parse response from IRI _getProductGroups where client_id = ' + client_id + ' and brand_id = ' + brand_id);
        }
    }).on('error', function(err) {
        winston.error('Failed to load IRI _getProductGroups for url ' + url);
        callback2(err);
    });
}

function _getProductsFromGroup(client_id, brand_id, group_id, additional_header_fields, callback2) {
    var url = 'http://productlocator.infores.com/productlocator/products/products.pli?';
    url += 'client_id=' + client_id;
    url += '&brand_id=' + brand_id;
    url += '&group_id=' + (group_id ? group_id : 'any');

    var headers = {
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive'
    };
    if(additional_header_fields) {
        headers = _.extend(headers, additional_header_fields);
    }
    //http://productlocator.infores.com/productlocator/products/products.pli?client_id=11&brand_id=NSTL&group_id=any

    var body = "";

    request({
        url: url,
        method: 'GET',
        headers: headers
    }).on('data', function (chunk) { // .pipe(zlib.createGunzip())
        body += chunk;
    }).on('end', function() {
        try {
            xml2js(body, function(err_xml, xml_data) {
                if(err_xml) {
                    winston.error('failed to parse IRI products in group response: ' + err_xml);
                    callback(err_xml);
                    return;
                }

                if(xml_data && xml_data['products']) {

                    // check for errors
                    if(xml_data['products'].error) {
                        callback(xml_data['groups'].error.message);
                        return;
                    }

                    if(!xml_data['products'].product) {
                        callback(null, []);
                        return;
                    }

                    _.each(xml_data['products'].product, function(product) {
                        winston.debug(product);
                        // TODO: process
                    });
                    callback2(null, xml_data['products'].product);
                    return;
                }
                callback2(null, []);
            });
        } catch(ex) {
            winston.error('could not parse response from IRI getProductList where client_id = ' + client_id + ' and brand_id = ' + brand_id);
            callback2('could not parse response from IRI getProductList where client_id = ' + client_id + ' and brand_id = ' + brand_id);
        }
    }).on('error', function(err) {
        winston.error('Failed to load IRI getProductList for url ' + url);
        callback2(err);
    });
}

// also accepts:
// required_fields: client_id, brand_id, upc10, zip
// optional_fields [default]: storespagenum [1], storesperpage [10], searchradius [10]
function _locateProductFromUPC(required_fields, optional_query, additional_header_fields, callback2) {
    var url = 'http://productlocator.infores.com/productlocator/servlet/ProductLocatorEngine?';
    url += 'clientid=' + required_fields.client_id;
    url += '&productfamilyid=' + required_fields.brand_id;
    url += '&producttype=upc';
    url += '&productid=' + required_fields.upc10;
    url += '&zip=' + required_fields.zip;

    // TODO: validate keys?
    if(optional_query) {
        _.each(_.keys(optional_query), function(query_key) {
            url += '&' + query_key + '=' + optional_query[query_key];
        });
    }

    var headers = {
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive'
    };
    if(additional_header_fields) {
        headers = _.extend(headers, additional_header_fields);
    }
    //http://productlocator.infores.com/productlocator/servlet/ProductLocatorEngine?clientid=11&productfamilyid=NSTL&producttype=upc&productid=2800001159&zip=28277

    var body = "";

    request({
        url: url,
        method: 'GET',
        headers: headers
    }).on('data', function (chunk) { // .pipe(zlib.createGunzip())
        body += chunk;
    }).on('end', function() {
        try {
            xml2js(body, function(err_xml, xml_data) {
                if(err_xml) {
                    winston.error('failed to parse IRI locate product response: ' + err_xml);
                    callback(err_xml);
                    return;
                }

                if(xml_data && xml_data['RESULTS']) {

                    // check for errors
                    if(xml_data['RESULTS']['ERROR'] && xml_data['RESULTS']['ERROR'].length > 0) {
                        callback2(xml_data['RESULTS']['ERROR'][0],{status:'check for errors'});
                        return;
                    }

                    // check for stores
                    if(!xml_data['RESULTS']['STORES']) {
                        callback2(xml_data['groups'].error.message,{status:'check for stores'});
                        return;
                    }

                    // make sure stores contains the store array
                    if(xml_data['RESULTS']['STORES'].length == 0) {
                        callback2(null, {status:'no data found'});
                        return;
                    }

                    // the count is stored in the first result - make sure it's not 0
                    if(xml_data['RESULTS']['STORES'][0]['$'] && xml_data['RESULTS']['STORES'][0]['$'].COUNT == "0") {
                        callback2(null, {
                            status: 'no store found',
                            nearbyStores: [],
                            numStoresFound: 0 // TODO: we should be using [$][COUNT] instead
                        });
                        return;
                    }

                    // build result to match our preferred internal format
                    var nearbyStores = [];
                    _.each(xml_data['RESULTS']['STORES'], function(store_page) {
                        //winston.debug('page contains ' + store_page['$']['COUNT'] + ' stores');
                        store_page['STORE'].forEach(function(store) {
                            nearbyStores.push({
                                city:       store['CITY'] ? store['CITY'][0] : '',
                                name:       store['NAME'] ? store['NAME'][0] : '',
                                zip:        store['ZIP'] ? store['ZIP'][0] : '',
                                distance:   store['DISTANCE'] ? store['DISTANCE'][0] : '',
                                store_id:   store['STORE_ID'] ? store['STORE_ID'][0] : '',
                                latitude:   store['LATITUDE'] ? store['LATITUDE'][0] : '',
                                longitude:  store['LONGITUDE'] ? store['LONGITUDE'][0] : '',
                                phone:      store['PHONE'] ? store['PHONE'][0] : '',
                                state:      store['STATE'] ? store['STATE'][0] : '',
                                address:    store['ADDRESS'] ? store['ADDRESS'][0] : ''
                            });
                        });
                    });


                    nearbyStores.forEach(function(store) {
                        try {
                            store.latitude = parseFloat(store.latitude);
                            store.longitude = parseFloat(store.longitude);
                        } catch(ex) {
                            winston.error('IRI product location could not parse geolocation to float');
                        }
                    });

                    callback2(null, {
                        distanceUnit: 'mi',
                        item: required_fields.upc10,
                        radius: '10', // TODO: parameterize
                        nearbyStores: nearbyStores,
                        numStoresFound: nearbyStores.length // TODO: we should be using [$][COUNT] instead
                    });
                    return;
                }
                callback2(null, {status:'no result'});
            });
        } catch(ex) {
            winston.error('could not parse response from IRI _locateProductFromUPC where client_id = ' + required_fields.client_id + ' and brand_id = ' + required_fields.brand_id);
            callback2('could not parse response from IRI _locateProductFromUPC where client_id = ' + required_fields.client_id + ' and brand_id = ' + required_fields.brand_id);
        }
    }).on('error', function(err) {
        winston.error('Failed to load IRI _locateProductFromUPC for url ' + url);
        callback2(err);
    });
}

function _locateProductGroup(client_id, brand_id, group, zip, additional_header_fields, callback2) {
    var url = 'http://productlocator.infores.com/productlocator/servlet/ProductLocatorEngine?';
    url += 'clientid=' + client_id;
    url += '&productfamilyid=' + brand_id;
    url += '&producttype=agg';
    url += '&productid=' + group;
    url += '&zip=' + zip;

    var headers = {
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive'
    };
    if(additional_header_fields) {
        headers = _.extend(headers, additional_header_fields);
    }
    //hhttp://productlocator.infores.com/productlocator/servlet/ProductLocatorEngine?clientid=10&productfamilyid=UNIL&producttype=agg&productid=any&zip=27410

    var body = "";

    request({
        url: url,
        method: 'GET',
        headers: headers
    }).on('data', function (chunk) { // .pipe(zlib.createGunzip())
        body += chunk;
    }).on('end', function() {
        try {
            xml2js(body, function(err_xml, xml_data) {
                winston.error('failed to parse IRI locate product group response: ' + err_xml);
                if(err_xml) {
                    callback(err_xml);
                    return;
                }

                // ['RESULTS']['QUERY']['PRODNAME'] could be useful
                if(xml_data && xml_data['RESULTS']) {

                    // check for errors
                    if(xml_data['RESULTS']['ERROR']) {
                        callback2(xml_data['ERROR']);
                        return;
                    }

                    // check for stores
                    if(!xml_data['RESULTS']['STORES']) {
                        callback2(xml_data['groups'].error.message);
                        return;
                    }

                    // make sure stores contains the store array
                    if(xml_data['RESULTS']['STORES'].length == 0) {
                        callback2(null, []);
                        return;
                    }

                    _.each(xml_data['RESULTS']['STORES'], function(store_page) {
                        //winston.debug('page contains ' + store_page['$']['COUNT'] + ' stores');
                        store_page['STORE'].forEach(function(store) {
                            winston.debug(store);
                        });

                        // TODO: process
                    });
                    callback2(null, xml_data['RESULTS']['STORES'].store);
                    return;
                }
                callback2(null, []);
            });
        } catch(ex) {
            winston.error('could not parse response from IRI _locateProductGroup where client_id = ' + client_id + ' and brand_id = ' + brand_id);
            callback2('could not parse response from IRI _locateProductGroup where client_id = ' + client_id + ' and brand_id = ' + brand_id);
        }
    }).on('error', function(err) {
        winston.error('Failed to load IRI _locateProductGroup for url ' + url);
        callback2(err);
    });
}

/*
_locateProductGroup(11, 'NSTL', 'powerbar_energy_blasts_energy_chews', 28277, function(err, res) {
    console.log('complete');
});
*/

/*
_locateProductFromUPC(11, 'NSTL', '2800001159', 28277, undefined, function(err, res) {
    console.log('complete');
});
*/
/*
_getProductsFromGroup(11, 'NSTL', 'powerbar_energy_blasts_energy_chews', function(err_products, products) {
    console.log('complete');
});
*/

/*
_getProductGroups(11, 'NSTL', function(err_product_groups, product_groups) {
    console.log('complete');
});
*/

/*
_getProductList(11, 'NSTL', function(err_products, products) {
    console.log('complete');
});
    */