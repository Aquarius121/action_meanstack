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
        opt_in_brand_1: function (test) {
            var url = '/opt-in?id=' + values.user_1_id + '&brand=' + values.brand_2_id;
            utilities.sendRequest(url, 'PUT',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "opt-in succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "opt-in failed");
                    test.done();
                }
            );
        },

        // because of PUT idempotency semantics, this should be legal, and result in only one opt-in record for the brand
        opt_in_brand_1_again: function (test) {
            var url = '/opt-in?id=' + values.user_1_id + '&brand=' + values.brand_2_id;
            utilities.sendRequest(url, 'PUT',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "re-opt-in succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "re-opt-in failed");
                    test.done();
                }
            );
        },

        get_user_opt_ins: function(test) {
            var url = '/opt-ins?id=' + values.user_1_id;
            utilities.sendRequest(url, 'GET',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(3);
                        test.ok(r.statusCode == 200, "get opt-ins succeeded");
                        test.ok(body && body.brands && body.brands.length == 1, "opt-ins in response");
                        test.ok(body.brands[0]._id == values.brand_2_id, "opt-in list correct");
                        test.done();
                        return;
                    }

                    test.ok(false, "get opt-ins failed");
                    test.done();
                }
            );
        },

        // simple deletion
        delete_brand_1_opt_in: function (test) {
            var url = '/opt-in?id=' + values.user_1_id + '&brand=' + values.brand_2_id;
            utilities.sendRequest(url, 'DELETE',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode == 200, "delete opt-in succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "delete opt-in failed");
                    test.done();
                }
            );
        },

        get_user_opt_ins_after_deletion: function(test) {
            var url = '/opt-ins?id=' + values.user_1_id;
            utilities.sendRequest(url, 'GET',
                {
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "get opt-ins succeeded");
                        test.ok(body && body.brands && body.brands.length == 0, "opt-ins not in response");
                        test.done();
                        return;
                    }

                    test.ok(false, "get opt-ins after deletionfailed");
                    test.done();
                }
            );
        }
    }
};