// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js

var _ = require('underscore');
var utilities = require('./test-utilities');
var values = require('./test-values');

module.exports = {

    login_admin: function(test) {
        utilities.sendRequest('/login', 'POST',
            {
                email: 'admin@example.com',
                password: values.admin_password,
                "remember-me": true
            },
            {},
            function (e, r, body) {
                if(e == null) {
                    if(r.statusCode == 200) {
                        test.expect(3);
                        test.ok(true, "login succeeded");
                        test.ok(!_.isUndefined(body) && !_.isUndefined(body._id), 'an id was given when logging in as admin');
                        test.ok(!_.isUndefined(r.headers["set-cookie"]), 'a cookie header was given at login');

                        values.admin_id = body._id;
                        values.admin_cookie = r.headers["set-cookie"];
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

    registration: {

        // simple register user
        register_user: function(test) {
            values.user_1_email = 'test' + (new Date()).getTime() + '@example.com';
            utilities.sendRequest('/user', 'PUT',
                {
                    email: values.user_1_email,
                    first_name: 'test',
                    last_name: 'user',
                    phone: '123-456-7890',
                    dob: '03/15/1991',
                    password: 'tester',
                    platform: 'web'
                },
                {},
                function (e, r, body) {
                    if(e == null) {
                        test.expect(3);
                        test.ok(r.statusCode == 200, "user create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        test.ok(typeof(body[0].password) == 'undefined', "user creation did not give away password hash");

                        values.user_1_id = body[0]._id;
                        values.user_1_cookie = r.headers["set-cookie"];

                        test.done();
                        return;
                    }

                    test.ok(false, "user creation failed");
                    test.done();
                }
            );
        },

        // register a second user for security testing
        register_user2: function(test) {
            values.user_2_email = 'test' + (new Date()).getTime() + '@example.com';
            utilities.sendRequest('/user', 'PUT',
                {
                    email: values.user_2_email,
                    first_name: 'test',
                    last_name: 'user',
                    phone: '123-456-7890',
                    dob: '03/15/1982',
                    password: 'tester',
                    platform: 'web'
                },
                {},
                function (e, r, body) {
                    if(e == null) {
                        test.expect(3);
                        test.ok(r.statusCode == 200, "user create succeeded");
                        test.ok(body.length == 1, "one result was returned");
                        test.ok(typeof(body[0].password) == 'undefined', "user creation did not give away password hash");

                        values.user_2_id = body[0]._id;
                        values.user_2_cookie = r.headers["set-cookie"];

                        test.done();
                        return;
                    }

                    test.ok(false, "user creation failed");
                    test.done();
                }
            );
        },

        // TODO: attempt to register a user with an email that's already taken

        // attempt to register a user with a password that is too short
        register_user_password_minlength: function(test) {
            utilities.sendRequest('/user', 'PUT',
                {
                    username: 'guy',
                    password: 'test'
                },
                {},
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "user create with a short password succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "user creation with a short password failed");
                    test.done();
                }
            );
        }

        // TODO: REQUIRED FIELDS TEST (ONLY ADDRESS FIELDS ARE OPTIONAL)
    },

    get: {

        // no cookie is passed
        get_ensure_auth: function(test) {

            utilities.sendRequest('/user/' + values.user_1_id, 'GET',
                {},
                {},
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "user get with no cookie rejected");
                        test.done();
                        return;
                    }

                    test.ok(false, "user get with no cookie accepted");
                    test.done();
                }
            );
        },

        // garbage cookie is passed
        get_user_garbage_cookie: function(test) {

            utilities.sendRequest('/user/' + values.user_1_id, 'GET',
                {},
                {
                    cookie: 'yum'
                },
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "user get with garbage cookie rejected");
                        test.done();
                        return;
                    }

                    test.ok(false, "user get with garbage cookie accepted");
                    test.done();
                }
            );
        },

        get_user_as_self: function(test) {

            utilities.sendRequest('/user/' + values.user_1_id, 'GET',
                {},
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if(e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "user get succeeded");
                        test.ok(typeof(body.password) == 'undefined', "user get did not give away password hash");
                        test.done();
                        return;
                    }

                    test.ok(false, "user get failed");
                    test.done();
                }
            );
        },

        get_user_other_user: function(test) {
            utilities.sendRequest('/user/' + values.user_2_id, 'GET',
                {},
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "user get of another user allowed");
                        test.done();
                        return;
                    }

                    test.ok(false, "user get of another user allowed");
                    test.done();
                }
            );
        },

        get_user_as_admin: function(test) {
            utilities.sendRequest('/user/' + values.user_1_id, 'GET',
                {},
                {
                    cookie: values.admin_cookie
                },
                function (e, r, body) {
                    if(e == null) {
                        test.expect(2);
                        test.ok(r.statusCode == 200, "user get as admin succeeded");
                        test.ok(typeof(body.password) == 'undefined', "user get as admin did not give away password hash");
                        test.done();
                        return;
                    }

                    test.ok(false, "user get as admin succeeded");
                    test.done();
                }
            );
        }
    },

    update: {

        update_user_no_cookie: function(test) {
            utilities.sendRequest('/user/' + values.user_1_id, 'POST',
                {
                    email: 'user1@example.com'
                },
                {
                },
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "user update without credentials was rejected");
                        test.done();
                        return;
                    }

                    test.ok(false, "user update without credentials was rejected");
                    test.done();
                }
            );
        },

        update_user: function(test) {
            utilities.sendRequest('/user/' + values.user_1_id, 'POST',
                {
                    email: 'user1@example.com',
                    first_name: "user1",
                    last_name: "last1",
                    phone: "614-543-2212",
                    dob: "03/10/1981",
                    address: {
                        street: "123 Ranch Rd",
                        city: "Columbus",
                        state: "OH",
                        zip: "43015"
                    }
                },
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode == 200, "user update succeeded");
                        test.done();
                        return;
                    }

                    test.ok(false, "user update succeeded");
                    test.done();
                }
            );
        },

        update_user_as_other_user: function(test) {
            utilities.sendRequest('/user/' + values.user_1_id, 'POST',
                {
                    email: 'user-dude@example.com',
                    first_name: "user",
                    last_name: "last",
                    phone: "312-312-3222",
                    dob: "03/10/1986",
                    address: {
                        street: "321 Ranch Rd",
                        city: "Columbus",
                        state: "GA",
                        zip: "12345"
                    }
                },
                {
                    cookie: values.user_2_cookie
                },
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "user update as other user rejected");
                        test.done();
                        return;
                    }

                    test.ok(false, "user update as other user rejected");
                    test.done();
                }
            );
        }
    },

    delete: {

        delete_user_as_other_user: function(test) {
            utilities.sendRequest('/user/' + values.user_2_id, 'DELETE',
                {},
                {
                    cookie: values.user_1_cookie
                },
                function (e, r, body) {
                    if(e == null) {
                        test.ok(r.statusCode != 200, "user delete as other user rejected");
                        test.done();
                        return;
                    }

                    test.ok(false, "user delete as other user rejected");
                    test.done();
                }
            );
        }
    }
};