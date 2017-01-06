// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js

var _ = require('underscore');
var config = require('./test-config');
var utilities = require('./test-utilities');
var values = require('./test-values');

module.exports = {

    general: {

        // simple creation
        favorite_product_1: function (test) {
            var url = '/favorite?id=' + values.user_1_id + '&product=' + values.product_1_id;
            utilities.sendRequest(url, 'PUT',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "favorite succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "favorite failed");
                    test.done();
                }
            );
        },

        // because of PUT idempotency semantics, this should be legal, and result in only one favorite record for the product
        favorite_product_1_again: function (test) {
            var url = '/favorite?id=' + values.user_1_id + '&product=' + values.product_1_id;
            utilities.sendRequest(url, 'PUT',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "re-favorite succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "re-favorite failed");
                    test.done();
                }
            );
        },

        get_user_favorites: function(test) {
            var url = '/favorites?id=' + values.user_1_id;
            utilities.sendRequest(url, 'GET',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(3);
                        test.ok(r.statusCode == 200, "get favorites succeeded");
                        test.ok(body && body.products && body.products.length == 1, "favorites in response");
                        //test.ok(body && (!body.brands || body.brands.length == 0), "favorite brands not in response");
                        test.ok(body.products[0]._id == values.product_1_id, "favorite list correct");
                        test.done();
                        return;
                    }

                    test.ok(false, "get favorites failed");
                    test.done();
                }
            );
        },

        // simple deletion
        delete_brand_1_favorite: function (test) {
            var url = '/favorite?id=' + values.user_1_id + '&product=' + values.product_1_id;
            utilities.sendRequest(url, 'DELETE',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "delete favorite succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "delete favorite failed");
                    test.done();
                }
            );
        },

        get_user_favorites_after_deletion: function(test) {
            var url = '/favorites?id=' + values.user_1_id;
            utilities.sendRequest(url, 'GET',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "get favorites succeeded");
                        test.ok(body && body.products && body.products.length == 0, "favorites not in response");
                        test.done();
                        return;
                    }

                    test.ok(false, "get favorites after deletionfailed");
                    test.done();
                }
            );
        }
    }
};