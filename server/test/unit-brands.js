// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js

var _ = require('underscore');
var config = require('./test-config');
var utilities = require('./test-utilities');
var values = require('./test-values');

var desired_brand_attributes = {
    'crm_email_endpoint': 'astute@example.com',
    'link': 'http://www.astutesolutions.com',
    'logo_url': 'http://www.astutesolutions.com/someimage.png'
};

module.exports = {

    creation: {

        // simple creation
        create_brand_1: function (test) {
            values.brand_1_name = 'test_brand_' + (new Date()).getTime();
            utilities.sendRequest('/brand', 'PUT',
                {
                    name: values.brand_1_name
                },
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "brand create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        values.brand_1_id = body[0]._id;
                        test.done();
                        return;
                    }

                    test.ok(false, "brand creation failed");
                    test.done();
                }
            );
        },

        // simple creation
        create_brand_2: function (test) {
            values.brand_2_name = 'test_brand_' + (new Date()).getTime() + 'A';
            utilities.sendRequest('/brand', 'PUT',
                {
                    name: values.brand_2_name
                },
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "brand create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        values.brand_2_id = body[0]._id;
                        test.done();
                        return;
                    }

                    test.ok(false, "brand creation failed");
                    test.done();
                }
            );
        },

        // attempt to create a brand without providing a name
        create_brand_no_name: function (test) {
            utilities.sendRequest('/brand', 'PUT',
                {},
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "brand create failed without name");
                        test.done();
                        return;
                    }

                    test.ok(true, "brand creation failed without name");
                    test.done();
                }
            );
        },

        // attempt to create a brand as a joe-schmoe user
        create_brand_as_user: function (test) {
            var faux_brand = 'test_brand_' + (new Date()).getTime();
            utilities.sendRequest('/brand', 'PUT',
                {
                    name: values.brand_1_name
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.ok(r.statusCode != 200, "brand create failed when creating as regular user");
                        test.done();
                        return;
                    }

                    test.ok(true, "brand create failed when creating as regular user");
                    test.done();
                }
            );
        }
    },

    management: {

        // TODO: create brand with name that already exists (currently allowed by service)

        create_brand_manager_1: function(test) {
            values.brand_manager_1_email = 'brand_manager_' + values.brand_1_name + '@example.com';
            utilities.sendRequest('/user', 'PUT',
                {
                    first_name: 'test',
                    last_name: 'user',
                    phone: '123-456-7890',
                    email: values.brand_manager_1_email,
                    dob: '09/15/1981',
                    password: 'tester',
                    platform: 'web',
                    role: 'brand-manager'
                },
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if(!e && r.statusCode == 200) {
                        test.expect(4);
                        test.ok(r.statusCode == 200, "brand manager create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        test.ok(typeof(body[0].password) == 'undefined', "brand manager creation did not give away password hash");
                        test.ok(typeof(r.headers["set-cookie"]) == 'undefined', "brand manager login cookie was not provided on creation");

                        values.brand_manager_1_id = body[0]._id;

                        test.done();
                        return;
                    }

                    test.ok(false, "user creation failed");
                    test.done();
                }
            );
        },

        // login as brand manager before getting brand access
        brand_manager_1_login_pre_access: function(test) {
            utilities.sendRequest('/login', 'POST',
                {
                    email: values.brand_manager_1_email,
                    password: 'tester',
                    "remember-me": true
                },
                {},
                function (e, r, body) {
                    if(e == null) {
                        if(r.statusCode == 200) {
                            test.expect(3);
                            test.ok(true, "login succeeded");
                            test.ok(!_.isUndefined(body) && !_.isUndefined(body._id), 'an id was given when logging in as brand manager');
                            test.ok(!_.isUndefined(r.headers["set-cookie"]), 'a cookie header was given at login');

                            values.brand_manager_1_cookie = r.headers["set-cookie"];
                            test.done();
                            return;
                        }

                        test.ok(false, "login succeed: " + body);
                        test.done();
                        return;
                    }
                    test.ok(false, "login succeed");
                    test.done();
                }
            );
        },

        update: {

            // attempt to update a brand with a brand manager that manages no brands
            brand_update_with_brandless_bm: function (test) {
                utilities.sendRequest('/brand/' + values.brand_1_id, 'POST',
                    {
                        name: "ACCESS ERROR FIXME"
                    },
                    {
                        cookie: values.brand_manager_1_cookie
                    },
                    function (e, r, body) {
                        if (e == null) {
                            test.ok(r.statusCode == 404, "brand update failed when updating as brandless bm");
                            test.done();
                            return;
                        }

                        test.ok(true, "brand update failed when updating as brandless bm");
                        test.done();
                    }
                );
            },

            // grant access for the brand manager to his brand
            give_brand_manager_1_brand_access: function (test) {
                utilities.sendRequest('/user/' + values.brand_manager_1_id, 'GET',
                    {},
                    {
                        cookie: values.admin_cookie
                    },
                    function (e, r, body) {
                        if(r.statusCode != 200) {
                            test.ok(false, "brand manager get failed");
                            test.done();
                            return;
                        }

                        test.expect(2);
                        test.ok(r.statusCode == 200, "brand manager get succeeded");

                        body.managed_brands = body.managed_brands ? body.managed_brands : [];
                        body.managed_brands.push(values.brand_1_id);
                        body.role = 'brand-manager';

                        utilities.sendRequest('/user/' + values.brand_manager_1_id, 'POST',
                            body,
                            {
                                cookie: values.admin_cookie
                            },
                            function (e, r, body) {
                                if (e == null) {
                                    test.ok(r.statusCode == 200, "brand manager update succeeded when updating managed brands as admin");
                                    test.done();
                                    return;
                                }

                                test.ok(false, "brand manager update failed when updating managed brands as admin");
                                test.done();
                            }
                        );
                    }
                );
            },

            // login as brand manager after getting access the the specified brand
            brand_manager_1_login_post_access: function (test) {
                utilities.sendRequest('/login', 'POST',
                    {
                        email: values.brand_manager_1_email,
                        password: 'tester',
                        "remember-me": true
                    },
                    {},
                    function (e, r, body) {
                        if (e == null) {
                            if (r.statusCode == 200) {
                                test.expect(3);
                                test.ok(true, "login succeeded");
                                test.ok(!_.isUndefined(body) && !_.isUndefined(body._id), 'an id was given when logging in as brand manager');
                                test.ok(!_.isUndefined(r.headers["set-cookie"]), 'a cookie header was given at login');

                                values.brand_manager_1_cookie = r.headers["set-cookie"];
                                test.done();
                                return;
                            }

                            test.ok(false, "login succeed: " + body);
                            test.done();
                            return;
                        }
                        test.ok(false, "login succeed");
                        test.done();
                    }
                );
            },

            // attempt to update a brand with a brand manager that manages no brands
            brand_update_with_branded_brand_manager: function (test) {
                var body = _.extend({}, desired_brand_attributes);
                body.name = values.brand_1_name + '-edited';
                utilities.sendRequest('/brand/' + values.brand_1_id, 'POST',
                    desired_brand_attributes,
                    {
                        cookie: values.brand_manager_1_cookie
                    },
                    function (e, r, body) {
                        if (e == null) {
                            test.ok(r.statusCode == 200, "brand update succeeded when bm given adequate brand access");
                            test.done();
                            return;
                        }

                        test.ok(false, "brand update succeeded when bm given adequate brand access");
                        test.done();
                    }
                );
            },

            // validate updates took effect
            brand_update_validation: function (test) {
                utilities.sendRequest('/brand/' + values.brand_1_id, 'GET',
                    {},
                    {
                        cookie: values.brand_manager_1_cookie
                    },
                    function (e, r, body) {
                        if (e == null && r.statusCode == 200) {
                            test.expect(2);
                            test.ok(body.length == 1, "one result was returned for brand");
                            var found_bad = false;
                            Object.keys(desired_brand_attributes).forEach(function (attribute_key) {
                                if (body[0][attribute_key] != desired_brand_attributes[attribute_key]) {
                                    found_bad = true;
                                }
                            });
                            test.ok(!found_bad, "all attributes appeared to save correctly from prior update");
                            test.done();
                            return;
                        }
                        test.ok(false, "brand get succeeded as brand manager");
                        test.done();
                    }
                );
            }
        },

        brand_access_negative: {

            brand_update_regular_user: function(test) {
                var body = _.extend({}, desired_brand_attributes);
                body.name = values.brand_1_name + '-hacked-by-user';

                Object.keys(desired_brand_attributes).forEach(function (attribute_key) {
                    body[attribute_key] = 'hacked-by-user';
                });

                utilities.sendRequest('/brand/' + values.brand_1_id, 'POST',
                    body,
                    {
                        cookie: values.user_1_cookie
                    },
                    function (e, r, body) {
                        if (e == null) {
                            test.ok(r.statusCode != 200, "brand update rejected for joe schmoe user");
                            test.done();
                            return;
                        }

                        test.ok(true, "brand update rejected for joe schmoe user");
                        test.done();
                    }
                );
            },

            brand_update_content_regular_user: function(test) {
                utilities.sendRequest('/brand/' + values.brand_1_id + '/content', 'POST',
                    {},
                    {
                        cookie: values.user_1_cookie
                    },
                    function (e, r, body) {
                        if (e == null) {
                            test.ok(r.statusCode == 404, "brand content update route not found for joe schmoe user");
                            test.done();
                            return;
                        }

                        test.ok(true, "brand content update route not found for joe schmoe user");
                        test.done();
                    }
                );
            },

            brand_update_styling_regular_user: function(test) {
                utilities.sendRequest('/brand/' + values.brand_1_id + '/styling', 'POST',
                    {
                        custom_styling: "",
                        components: ""
                    },
                    {
                        cookie: values.user_1_cookie
                    },
                    function (e, r, body) {
                        if (e == null) {
                            test.ok(r.statusCode == 404, "brand styling update route not found for joe schmoe user");
                            test.done();
                            return;
                        }

                        test.ok(true, "brand styling update route not found for joe schmoe user");
                        test.done();
                    }
                );
            },

            brand_update_features_regular_user: function(test) {

                // invalid id, but we're testing for 404 anyways
                utilities.sendRequest('/brand/' + values.brand_1_id + '/features?feature=1', 'POST',
                    {},
                    {
                        cookie: values.user_1_cookie
                    },
                    function (e, r, body) {
                        if (e == null) {
                            test.ok(r.statusCode == 404, "brand features update route not found for joe schmoe user");
                            test.done();
                            return;
                        }

                        test.ok(true, "brand features update route not found for joe schmoe user");
                        test.done();
                    }
                );
            },

            brand_update_other_brand_as_brand_manager: function(test) {
                var body = _.extend({}, desired_brand_attributes);
                body.name = values.brand_1_name + '-edited-by-other-bm';
                utilities.sendRequest('/brand/' + values.brand_2_id, 'POST',
                    desired_brand_attributes,
                    {
                        cookie: values.brand_manager_1_cookie
                    },
                    function (e, r, body) {
                        if (e == null) {
                            test.ok(r.statusCode == 404, "brand resource not found when editted by unauthorized brand manager");
                            test.done();
                            return;
                        }

                        test.ok(true, "brand resource not found when editted by unauthorized brand manager");
                        test.done();
                    }
                );
            }
        }
    },

    // try to access, update admins, users as brand managers
    user_access: {

        brand_manager_add_brands_to_self: function(test) {
            utilities.sendRequest('/user/' + values.brand_manager_1_id, 'GET',
                {},
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    test.expect(2);
                    test.ok(r.statusCode == 200, "brand manager get succeeded");

                    body.managed_brands = body.managed_brands ? body.managed_brands : [];
                    body.managed_brands.push(values.brand_2_id);
                    body.role = 'brand-manager';

                    utilities.sendRequest('/user/' + values.brand_manager_1_id, 'POST',
                        body,
                        {
                            cookie: values.brand_manager_1_cookie
                        },
                        function (e, r, body) {
                            if (e == null) {
                                test.ok(r.statusCode != 200, "brand manager not allowed to give access to other brands");
                                test.done();
                                return;
                            }

                            test.ok(false, "brand manager not allowed to give access to other brands");
                            test.done();
                        }
                    );
                }
            );
        },

        brand_manager_update_admin: function(test) {
            utilities.sendRequest('/user/' + values.admin_id, 'POST',
                {
                    email: 'hackedadmin@example.com',
                    first_name: "BM HACKED YOU",
                    last_name: "FROM TESTS",
                    phone: "312-312-3222",
                    age_range: "",
                    address: {
                        street: "123 BM Hacked You Rd",
                        city: "Columbus",
                        state: "GA",
                        zip: "12345"
                    }
                },
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "admin update as brand manager rejected");
                        test.done();
                        return;
                    }

                    test.ok(false, "admin update as brand manager rejected");
                    test.done();
                }
            );
        },

        brand_manager_update_user: function(test) {
            utilities.sendRequest('/user/' + values.user_1_id, 'POST',
                {
                    email: 'hackeduser@example.com',
                    first_name: "BM HACKED YOU",
                    last_name: "FROM TESTS",
                    phone: "312-312-3222",
                    age_range: "",
                    address: {
                        street: "123 BM Hacked You Rd",
                        city: "Columbus",
                        state: "GA",
                        zip: "12345"
                    }
                },
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "user update as brand manager rejected");
                        test.done();
                        return;
                    }

                    test.ok(false, "user update as brand manager rejected");
                    test.done();
                }
            );
        }
    },

    query: {

        bm_table_query_no_params: function(test) {
            utilities.sendRequest('/brand', 'GET',
                {
                },
                {
                    cookie: values.brand_manager_1_cookie
                },
                function (e, r, body) {
                    if (e == null) {
                        test.expect(3);
                        test.ok(r.statusCode == 200, "brand get succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        test.ok(body[0]._id == values.brand_1_id, "created brand was returned");
                        test.done();
                        return;
                    }

                    test.ok(false, "brand get failed");
                    test.done();
                }
            );
        }
    }
};