// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js

var _ = require('underscore');
var utilities = require('./test-utilities');
var values = require('./test-values');

module.exports = {

    // these tests are designed to test that non-admin users cannot use admin functionality
    access: {

        //
        product_admin_as_user: function (test) {
            utilities.sendRequest('/admin/products?action=remove-unbranded', 'POST',
                {},
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "admin products/remove-unbranded as regular user");
                        test.done();
                        return;
                    }

                    test.ok(true, "admin products/remove-unbranded as regular user");
                    test.done();
                }
            );
        },

        //
        product_admin_as_dm: function (test) {
            utilities.sendRequest('/admin/products?action=remove-unbranded', 'POST',
                {},
                {
                    cookie: values.brand_bm_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "admin products/remove-unbranded as brand manager");
                        test.done();
                        return;
                    }

                    test.ok(true, "admin products/remove-unbranded as brand manager");
                    test.done();
                }
            );
        },

        //
        reports_admin_as_user: function (test) {
            utilities.sendRequest('/admin/reports?action=process', 'POST',
                {},
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "admin reports/process as regular user");
                        test.done();
                        return;
                    }

                    test.ok(true, "admin reports/process as regular user");
                    test.done();
                }
            );
        },

        reports_admin_as_brand_manager: function (test) {
            utilities.sendRequest('/admin/reports?action=process', 'POST',
                {},
                {
                    cookie: values.brand_bm_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "admin reports/process as brand manager");
                        test.done();
                        return;
                    }

                    test.ok(true, "admin reports/process as brand manager");
                    test.done();
                }
            );
        },

        // recompute-product-counts
        recompute_counts_as_user: function (test) {
            utilities.sendRequest('/admin/brands?action=recompute-product-counts', 'POST',
                {},
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "admin brands as regular user");
                        test.done();
                        return;
                    }

                    test.ok(true, "admin brands as regular user");
                    test.done();
                }
            );
        },

        recompute_counts_as_bm: function (test) {
            utilities.sendRequest('/admin/brands?action=recompute-product-counts', 'POST',
                {},
                {
                    cookie: values.brand_bm_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "admin brands as brand manager");
                        test.done();
                        return;
                    }

                    test.ok(true, "admin brands as brand manager");
                    test.done();
                }
            );
        }
    }
};