// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js

var _ = require('underscore');
var utilities = require('./test-utilities');
var values = require('./test-values');

function _getEan() {
    var full_string = ('TEST' + (new Date()).getTime());
    var start = full_string.length - 14;
    return full_string.substring(start, start + 13);
}

var desired_product_attributes = {
    'ean': _getEan(),
    'upc': _getEan().substring(0, 12),
    'name': 'PRODUCT' + (new Date()).getTime()
};

module.exports = {

    creation: {

        build_product_attributes: function(test) {
            desired_product_attributes.brand = values.brand_1_id;
            desired_product_attributes.brand_name = values.brand_1_name;

            test.ok(true, "product attributes applied locally");
            test.done();
        },

        create_product_as_user: function(test) {
            utilities.sendRequest('/product', 'PUT',
                desired_product_attributes,
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "product create disallowed for user");
                        test.done();
                        return;
                    }

                    test.ok(true, "product creation rejected for user");
                    test.done();
                }
            );
        },

        /*
        create_product_as_brand_manager: function(test) {
            utilities.sendRequest('/product', 'PUT',
                desired_product_attributes,
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "product create disallowed for brand manager");
                        test.done();
                        return;
                    }

                    test.ok(true, "product creation rejected for brand manager");
                    test.done();
                }
            );
        },

        create_product_as_admin: function(test) {
            utilities.sendRequest('/product', 'PUT',
                desired_product_attributes,
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "product create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        values.brand_1_id = body[0]._id;
                        test.done();
                        return;
                    }

                    test.ok(false, "product creation failed");
                    test.done();
                }
            );
        }
*/

        create_product_without_brand_as_brand_manager: function(test) {
            var product_without_brand = _.omit(desired_product_attributes, 'brand');
            product_without_brand = _.omit(product_without_brand, 'brand_name');

            utilities.sendRequest('/product', 'PUT',
                product_without_brand,
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "product create disallowed for brand manager where brand not specified");
                        test.done();
                        return;
                    }

                    test.ok(true, "product create disallowed for brand manager where brand not specified");
                    test.done();
                }
            );
        },

        create_product_with_brand_as_brand_manager: function(test) {
            utilities.sendRequest('/product', 'PUT',
                desired_product_attributes,
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "product create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        values.product_1_ean = desired_product_attributes.ean;
                        values.product_1_id = body[0]._id;
                        test.done();
                        return;
                    }

                    test.ok(false, "product creation failed");
                    test.done();
                }
            );
        },

        create_product_without_brand_as_admin: function(test) {
            var ean = _getEan();
            utilities.sendRequest('/product', 'PUT',
                {
                    'ean': ean,
                    'upc': ean.substring(0, 12),
                    'name': 'PRODUCT' + (new Date()).getTime()
                },
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "product create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        values.product_2_ean = ean;
                        values.product_2_id = body[0]._id;
                        test.done();
                        return;
                    }

                    test.ok(false, "product creation failed");
                    test.done();
                }
            );
        }
    },

    query: {

        bm_table_query_no_params: function(test) {
            utilities.sendRequest('/products', 'GET',
                {
                },
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "product get succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        test.done();
                        return;
                    }

                    test.ok(false, "product get failed");
                    test.done();
                }
            );
        },

        bm_open_query: function(test) {
            utilities.sendRequest('/products/find?ean_or_name=&count=true&page=0&pageSize=10', 'GET',
                {
                },
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(3);
                        test.ok(r.statusCode == 200, "product open query succeeded");
                        test.ok(body.products.length <= 10, "less than max results were returned");
                        test.ok(body.products.length > 0, "some results were returned");

                        test.done();
                        return;
                    }

                    test.ok(false, "product open query failed");
                    test.done();
                }
            );
        }
    }
};