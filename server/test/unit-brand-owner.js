// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js

var _ = require('underscore');
var utilities = require('./test-utilities');
var values = require('./test-values');

module.exports = {

    creation: {

        // simple creation
        create_brand_owner_1: function (test) {

            values.brand_owner_1_name = 'test_brand_owner_' + (new Date()).getTime();
            utilities.sendRequest('/brand-owner', 'PUT',
                {
                    name: values.brand_owner_1_name,
                    link: 'www.test-link.com'
                },
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "brand owner create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        values.brand_owner_1_id = body[0]._id;
                        test.done();
                        return;
                    }

                    test.ok(false, "brand owner creation failed");
                    test.done();
                }
            );
        }
    },

    update: {

        update_brand_owner_1: function (test) {

            utilities.sendRequest('/brand-owner/' + values.brand_owner_1_id, 'POST',
                {
                    name: values.brand_owner_1_name,
                    link: 'www.test-link-updated.com'
                },
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(1);
                        test.ok(r.statusCode == 200, "brand owner create succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "brand owner creation failed");
                    test.done();
                }
            );
        },

        add_brand_1: function(test) {

            utilities.sendRequest('/brand/' + values.brand_1_id + '?brand_owner=true', 'POST',
                {
                    brand_owner: values.brand_owner_1_id
                },
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(1);
                        test.ok(r.statusCode == 200, "brand owner create succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "brand owner creation failed");
                    test.done();
                }
            );
        },

        ensure_brand_belongs_to_owner: function(test) {

            utilities.sendRequest('/brand/' + values.brand_1_id, 'GET',
                {
                },
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(3);
                        test.ok(r.statusCode == 200, "brand owner create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        test.ok(body[0].brand_owner == values.brand_owner_1_id, "brand owner matches");
                        // TODO: ensure it matches
                        test.done();
                        return;
                    }

                    test.ok(false, "brand owner creation failed");
                    test.done();
                }
            );
        }
    }
};