// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js

var _ = require('underscore');
var utilities = require('./test-utilities');
var values = require('./test-values');

module.exports = {

    cleanup_users: {

        delete_user: function (test) {
            utilities.sendRequest('/user/' + values.user_2_id, 'DELETE',
                {},
                {
                    cookie: values.user_2_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "user delete succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "user delete succeeded");
                    test.done();
                }
            );
        },

        delete_user1: function (test) {
            utilities.sendRequest('/user/' + values.user_1_id, 'DELETE',
                {},
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "user delete succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "user delete succeeded");
                    test.done();
                }
            );
        },

        delete_bm1: function (test) {
            utilities.sendRequest('/user/' + values.brand_manager_1_id, 'DELETE',
                {},
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "user delete succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "user delete succeeded");
                    test.done();
                }
            );
        },

        delete_product_1: function(test) {
            utilities.sendRequest('/product/' + values.product_1_id, 'DELETE',
                {},
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "product delete succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "product delete succeeded");
                    test.done();
                }
            );
        },

        delete_product_2: function(test) {
            utilities.sendRequest('/product/' + values.product_2_id, 'DELETE',
                {},
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "product delete succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "product delete succeeded");
                    test.done();
                }
            );
        },

        delete_brand_1: function(test) {
            utilities.sendRequest('/brand/' + values.brand_1_id, 'DELETE',
                {},
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "brand delete succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "brand delete succeeded");
                    test.done();
                }
            );
        },

        delete_brand_2: function(test) {
            utilities.sendRequest('/brand/' + values.brand_2_id, 'DELETE',
                {},
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "brand delete succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "brand delete succeeded");
                    test.done();
                }
            );
        },

        delete_brand_owner_1: function(test) {
            utilities.sendRequest('/brand-owner/' + values.brand_owner_1_id, 'DELETE',
                {},
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "brand owner delete succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "brand owner delete succeeded");
                    test.done();
                }
            );
        }
    }
};