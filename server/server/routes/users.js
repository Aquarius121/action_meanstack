var _ = require('underscore');
var async = require('async');
var config = require('config');
var crypto = require('crypto');
var ObjectID = require('mongodb').ObjectID;
var passport = require('passport');
var semaphore = require('semaphore')(1);
var winston = require('winston');

var database = require('../database/instances/action');
var mail = require('../mail');
var audit_database = require('../database/instances/action-audit');
var message_database = require('../database/instances/action-message');
var product_database = require('../database/instances/product-info');
var security = require('../security');

var aws_util = require('../util/aws-utils');
var general_util = require('../util/general-utils');
var user_util = require('../util/user-utils');

var result_limit = 500;

module.exports = {
    user_create_view: _handleUserCreateView,
    users_view: _handleUsersView,
    user_view: _handleUserView,
    login_view: _handleLoginView,
    logout_get: _handleLogoutGet,
    logout_post: _handleLogoutPost,
    user_messages_view: _handleUserMessagesView,
    register_view: _handleRegisterView,

    user_query: _handleUserQuery,

    user_get: _handleUserGet,
    user_get_content: _handleUserGetContent,
    user_update: _handleUserUpdate,
    user_create: _handleUserCreate,
    user_delete: _handleUserDelete,
    user_add_brand: _handleAddBrandToUser,
    user_upload_content: _handleUploadContent,
    login_post: _handleLoginPost,

    lost_password: _handleLostPassword,
    reset_password_link_target: _handleGetResetPassword,
    reset_password: _handleResetPassword
};

function _handleUserCreateView(req, res) {
    res.render('user-create', {
        caller: user_util.getCaller(req),
        title: 'Create User',
        url: req.url
    });
}

function _handleUsersView(req, res) {
    res.render('users', {
        caller: user_util.getCaller(req),
        title: 'Users',
        url: req.url
    });
}

function _handleUserMessagesView(req, res) {
    if(!general_util.isValidId(req.param('id'))) {
        res.send('invalid id', 500);
        return;
    }

    res.render('user-history', {
        caller: user_util.getCaller(req),
        user_id: req.param('id'),
        title: 'Messages',
        url: req.url
    });
}

function _handleRegisterView(req, res) {
    res.render('register', {
        caller: user_util.getCaller(req),
        title: 'Register for Action!',
        url: req.url
    });
}

function _handleUserQuery(req, res) {
    var query = {}, sort_by = {}, options = {};

    var fields = {
        first_name: 1,
        last_name: 1,
        email: 1,
        role: 1,
        resolved_survey: 1
    };

    general_util.buildTableQuery(req.query.sort, req.query.filter, null, query, sort_by, []);


    database.user_account.find(query, fields, options).sort(sort_by).limit(result_limit).toArray(function(err, data) {
        if(err != null) {
            res.send('An error occurred: ' + err, 500);
            return;
        }

        if(data == null) {
            res.send({rows: [], total_records: 0}, 200);
            return;
        }

        var results = general_util.getPage(data, req.query['page'], req.query['pageSize']);
        res.send({rows: results, total_records: data.length}, 200);
    });
}

function _handleUserView(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    user_util.getSafeUserById(database.user_account, caller, id,
        function(err, code) {
            res.send(err, code);
        }, function(user) {
            user = _.omit(user, 'password');

            res.render('user', {
                caller: caller,
                user: user,
                title: 'User Profile',
                url: req.url
            });
        }
    );
}

function _handleUserGet(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    user_util.getSafeUserById(database.user_account, caller, id,
        function(err, code) {
            res.send(err, code);
        }, function(user) {
            user = _.omit(user, 'content');

            res.send(user, 200);
        }
    );
}

function _handleUserGetContent(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    user_util.getSafeUserById(database.user_account, caller, id,
        function(err, code) {
            res.send(err, code);
        }, function(user) {
            res.send(user.content ? user.content : [], 200);
        }
    );
}

function _handleUserUpdate(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    if(!user_util.canEditUser(caller, id)) {
        general_util.send404(res);
        return;
    }

    var set_values = {
        first_name: req.param('first_name'),
        last_name: req.param('last_name'),
        phone: req.param('phone'),
        opt: req.param('opt') == 'true',
        gender: req.param('gender'),
        dob: req.param('dob'),
        image_url: req.param('image_url'),
        address: {
            street: req.param('street'),
            city: req.param('city'),
            state: req.param('state'),
            zip: req.param('zip'),
            country: req.param('country')
        }
    };

    _validateUser(set_values, false, function(err_user) {
        if(err_user) {
            res.send(err_user, 500);
            return;
        }

        user_util.setAgeFields(set_values);

        database.user_account.findOne({_id: ObjectID(id)}, function(err_user, user) {
            if(err_user != null) {
                res.send(err_user, 500);
                return;
            }

            if(user == null) {
                general_util.send404(res);
                return;
            }

            if(req.param('role')) {
                set_values.role = req.param('role');
            }

            if(req.param('password')) {
                set_values.password = security.saltAndHash(req.param('password'));
            }

            // managed_brands = [] will be represented in a way such that it isn't part of the incoming json
            // therefore, it is required when updating a user as admin
            var managed_brands = req.param('managed_brands');
            if(managed_brands || caller.role == 'admin') {
                if(caller.role != 'admin') {
                    res.send('insufficient access', 500);
                    return;
                }

                set_values.managed_brands = managed_brands ? managed_brands : [];
            }

            database.user_account.update(
                {
                    _id: ObjectID(id)
                },
                {
                    $set: set_values
                },
                function(err_update, update_result) {
                    if(err_update != null) {
                        res.send(err_update, 500);
                        return;
                    }

                    if(update_result == 0) {
                        res.send('not updated', 500);
                        return;
                    }
                    res.send({update_count: update_result}, 200);
                }
            );
        });
    });
}

function _handleUserCreate(req, res) {
    var caller = user_util.getCaller(req);

    var set_values = {
        email: req.param('email'),
        first_name: req.param('first_name'),
        last_name: req.param('last_name'),
        password: req.param('password'),
        dob: req.param('dob'),
	gender: req.param('gender'),
        opt: req.param('opt') == 'true',
        role: 'user'
    };

    // process optional parameters
    if(req.param('image_url')) {
        set_values.image_url = req.param('image_url');
    }

    if(req.param('facebook_data')) {
        set_values.facebook_data = req.param('facebook_data');
    }
    if(req.param('google_data')) {
        set_values.google_data = req.param('google_data');
    }
    async.series({

        'user_validate': function(callback) {
            _validateUser(set_values, true, function(err_validate) {
                callback(err_validate);
            });
        },

        'email_match': function(callback) {

            // check uniqueness of email
            database.user_account.findOne({
                email: general_util.getCaseInsensitiveProperty(set_values.email)
            }, function(err_email, user_with_email) {
                if (err_email != null) {
                    callback(err_email);
                    return;
                }

                if (user_with_email != null) {
                    callback('a user already exists with that email');
                    return;
                }

                callback();
            });
        },

        'user_create': function(callback) {
            if(caller && caller.role.indexOf('admin') != -1) {
                set_values.role = req.param('role');
            }

            if(!_.isUndefined(req.param('street'))) {
                set_values.address = (set_values.address ? set_values.address : {});
                set_values.address.street = req.param('street');
            }

            if(!_.isUndefined(req.param('city'))) {
                set_values.address = (set_values.address ? set_values.address : {});
                set_values.address.city = req.param('city');
            }

            if(!_.isUndefined(req.param('state'))) {
                set_values.address = (set_values.address ? set_values.address : {});
                set_values.address.state = req.param('state');
            }

            if(!_.isUndefined(req.param('zip'))) {
                set_values.address = (set_values.address ? set_values.address : {});
                set_values.address.zip = req.param('zip');
            }

            user_util.setAgeFields(set_values);

            if(set_values.password) {
                set_values.password = security.saltAndHash(set_values.password);
            }

            database.user_account.insert(set_values, function(err_insert, insert_result) {
                if(err_insert != null) {
                    callback(err_insert);
                    return;
                }

                if(!insert_result || insert_result.length == 0) {
                    callback('did not get a user object back from the database');
                    return;
                }

                if(!caller) {
                    user_util.setCaller(req, insert_result[0]);
                }

                _.each(insert_result, function(user, index, array) {
                    array[index] = user_util.getSafeUser(user);
                });

                callback(null, insert_result);
            });
        }
    }, function(err_insert, insert_result) {
        if(err_insert) {
            res.send(err_insert, 500);
            return;
        }

        var audit_record = audit_database.generateAuditRecord(req, {
            'user_id': insert_result.user_create[0]._id.toHexString()
        });
        audit_database.reportEvent('registrations', audit_record);
        res.send(insert_result.user_create, 200);
    });
}

function _validateUser(user, is_create, callback) {
    if(is_create) {
        if(!user.password && !user.facebook_data && !user.google_data) {
            callback('password must be specified');
            return;
        }

        if(user.password && user.password.length < 6) { // TODO: check strength?
            callback('password must be 6 characters or more');
            return;
        }

        if(!user.email) {
            callback('email must be specified');
            return;
        }
    }

    if(!user.first_name || user.first_name.trim().length == 0) {
        callback('first name must be specified');
        return;
    }

    if(!user.last_name || user.last_name.trim().length == 0) {
        callback('last name must be specified');
        return;
    }

    // TODO: validate email format

    // TODO: validate correct date
    if(_.isUndefined(user.dob) || user.dob.trim().length == 0) {
        callback('date of birth must be specified');
        return;
    }

    callback();
}

function _handleUserDelete(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    if(!user_util.canEditUser(caller, id)) {
        general_util.send404(res);
        return;
    }

    database.user_account.findOne({_id: ObjectID(id)}, function(err_user, user) {
        if(err_user != null) {
            res.send(err_user, 500);
            return;
        }

        if(user == null) {
            general_util.send404(res);
            return;
        }

        database.user_account.remove({_id: ObjectID(id)}, function(err_remove, remove_result) {
            if(err_remove != null) {
                res.send(err_remove, 500);
                return;
            }
            if(remove_result == 0) {
                res.send('no records deleted', 500);
                return;
            }
            res.send({remove_count: remove_result}, 200);
        });
    });
}

// TODO: query for the brand by id to be sure it exists
function _handleAddBrandToUser(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');
    var brand_id = req.param('brand');

    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    if(_.isUndefined(brand_id)) {
        res.send('a brand id must be supplied', 500);
        return;
    }

    if(!general_util.isValidId(brand_id)) {
        res.send('invalid brand id');
        return;
    }

    if(!user_util.canEditUser(caller, id)) {
        general_util.send404(res);
        return;
    }

    database.user_account.findOne({_id: ObjectID(id)}, function(err_user, user) {
        if(err_user != null) {
            res.send(err_user, 500);
            return;
        }

        if(user == null) {
            general_util.send404(res);
            return;
        }

        if(_.isUndefined(user.managed_brands)) {
            user.managed_brands = [];
        }
        user.managed_brands.push(brand_id);

        database.user_account.update(
            {_id: ObjectID(id)},
            {$set: {managed_brands: user.managed_brands}},
            function(err_update, update_result) {
                if(err_update != null) {
                    res.send(err_update, 500);
                    return;
                }
                if(update_result == 0) {
                    res.send('no records deleted', 500);
                    return;
                }
                res.send({update_count: update_result}, 200);
            }
        );
    });
}

function _handleLoginView(req, res) {
    var caller = user_util.getCaller(req);
    if(!caller) {
        res.render('login', { title: 'Login' });
        return;
    }
    res.redirect('/');
}


function _handleLoginPost(req, res, next) {
    passport.authenticate('local-simple', {session: true}, function(err, user, info) {
        if(err) {
            return next(err)
        }

        if(!user) {
            req.session.messages =  [info.message];
            res.send(info.message, 500);
            return;
        }

        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }

            var audit_record = audit_database.generateAuditRecord(req, {});
            audit_database.reportEvent('logins', audit_record);

            req.session.touch();
            res.send(_.omit(user, 'password'), 200);
            return; //  res.redirect('/')
        });
    })(req, res, next);
}

function _handleLogoutGet(req, res) { // , next
    req.session['passport'].user = undefined;
    req.session.save();
    req.logOut();

    if('undefined' != typeof req.session['google-signin'] && req.session['google-signin'])
    {

        res.redirect('/google/plus/logout');
        return;
    }
    if('undefined' != typeof req.session['facebook-signin'] && req.session['facebook-signin'])
    {

        res.redirect('/facebook/logout');
        return;
    }

    if(req.param('redirect') && req.param('redirect') == 'true') {
        res.redirect('/login/');
        return;
    }
    res.send('{result: "ok"}', 200);
}

function _handleLogoutPost(req, res) {
    req.logOut();
    res.send('{result: "ok"}', 200);
}

function _handleUploadContent(req, res) {
    var caller = user_util.getCaller(req);
    var id = req.param('id');

    if(!user_util.canEditUser(caller, id)) {
        general_util.send404(res);
        return;
    }

    user_util.getSafeUserById(database.user_account, caller, id,
        function(err, code) {
            res.send(err, code);
        }, function(user) {

            // user exists and we have access to it

            var upload_file;

            async.series({

                upload_result: function(callback) {
                    if(!req.files || !req.files.file) {
                        callback();
                        return;
                    }
                    _uploadFile(id, req.files.file, function(err_upload, upload_result) {
                        upload_file = upload_result;
                        callback(err_upload, upload_file);
                    });
                }

            }, function(err_loads, load_results) {
                if(err_loads) {
                    res.send(err_loads, 500);
                    return;
                }
                res.send(load_results.upload_result, 200);
            });
        }
    );
}

function _handleLostPassword(req, res) {
    var email = req.param('email');
    if(!email) {
        res.send('an email must be provided', 500);
        return;
    }
    if(!general_util.validateEmail(email)) {
        res.send('email format invalid', 500);
        return;
    }

    database.user_account.findOne({email: general_util.getCaseInsensitiveProperty(email)}, function(err, user) {
        if(err) {
            res.send(err, 500);
            return;
        }

        if(!user) {
            res.send({result: 'ok'}, 200);
            //general_util.send404(res, 'no user is registered to that email address');
            return;
        }

        crypto.randomBytes(48, function(ex, buf) {
            var token = buf.toString('hex');
            user.reset_token = token;
            database.user_account.update({_id: user._id}, {$set: {reset_token: token}}, function (err_update) { // , update_result
                if (err_update) {
                    res.send(err_update, 500);
                    return;
                }

                //mail.semaphore.take(function() {
                mail.connectOutbound(function(err, connection) {
                    if(err) {
                        //mail.semaphore.leave();
                        res.send('could not send email', 500);
                        return;
                    }

                    mail.sendResetPasswordLink(config['site']['domain'], connection, user, token, function(e){ // , m
                        //mail.semaphore.leave();
                        if(e) {
                            res.send(e, 500);
                            return;
                        }
                        res.send({result: 'ok'}, 200);
                    });
                });
                //});
            });


        });
    });
}

function _handleGetResetPassword(req, res) {
    var email = req.query["e"];

    database.user_account.findOne({email: general_util.getCaseInsensitiveProperty(email)}, function(e, user) {
        if(e) {
            res.send(e, 500);
            return;
        }

        if(!user) {
            res.send('invalid request', 500);
            return;
        }

        if(user.reset_token != req.query["token"]) {
            res.send('we were not expecting a password reset for this user', 500); // TODO: should not reveal existence of user!
            return;
        }

        req.session.reset = { email:email };
        res.redirect('/login?reset=true');
    });
}

function _handleResetPassword(req, res) {
    winston.log('debug', 'began processing a POST /reset-password request');

    var nPass = security.saltAndHash(req.param('pass'));
    // retrieve the user's email from the session to lookup their account and reset password
    if(_.isUndefined(req.session.reset)) {
        res.send('reset information not found', 500);
        return;
    }

    // destroy the session immediately after retrieving the stored email

    database.user_account.update(
        {
            email: general_util.getCaseInsensitiveProperty(req.session.reset.email)
        },
        {
            $set: { password: nPass }
        },
        function(err_update) { // , update_result
            if(err_update) {
                res.send(err_update, 500);
                return;
            }
            // TODO: check o == 1
            res.send({result: 'ok'}, 200);
        }
    );
    req.session.destroy();
}

function _uploadFile(user_id, file, callback2) {
    aws_util.file_upload('', file, "content/user-content/" + user_id, function(err_upload, upload_result) {
        if(err_upload) {
            callback2(err_upload);
            return;
        }
        semaphore.take(function() {
            database.user_account.update(
                {_id: ObjectID(user_id)},
                {$push: {content: upload_result}},
                function (err_user_update) { // , user_update_result
                    semaphore.leave();
                    if (err_user_update) {
                        callback2('could not associate with user: ' + err_user_update);
                        return;
                    }
                    callback2(null, upload_result);
                }
            );
        });
    });
}
