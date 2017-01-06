var _ = require('underscore');
var async = require('async');
var config = require('config');
var qs = require('querystring');
var request = require('request');
var winston = require('winston');

var general_util = require('../util/general-utils');
var user_util = require('../util/user-utils');

var database = require('../database/instances/action');

module.exports = {
    facebook_login: _handleFacebookLogin,
    facebook_logout: _handleFacebookLogout,
    facebook_oauth: _handleFacebookOAuth,
    facebook_me_info: _handleFacebookMeInfo
};

function _handleFacebookLogin(req, res) {
    if(!_.isUndefined(req.param('redirect')) && req.session) {
        req.session['oauth-redirect'] = req.param('redirect');
        req.session['facebook-signin'] = true;
        req.session.save()
    };
    res.redirect('https://www.facebook.com/dialog/oauth?' +
        'client_id=' + config['facebook'].appId +
        '&state=' + config['facebook'].state +
        '&response_type=' + config['facebook'].responseType +
        '&scope=' + config['facebook'].scope +
        '&type=web_server' +
        '&redirect_uri=' + config['facebook'].redirectUriBase + '/facebook/oauth')
}

function _handleFacebookLogout(req, res) {
    var accessToken = req.session['facebook-access-token'];
    //var revokeUrl = 'https://graph.facebook.com/me/permissions?method=delete&access_token=' + accessToken;
    var revokeUrl = 'https://www.facebook.com/logout.php?next=' + config['facebook'].redirectUriBase + '&access_token='+accessToken;

    request({
        method: 'GET',
        url: revokeUrl,
        async: false,
        contentType: "application/json",
        dataType: 'jsonp',
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded'
        }
    }, function(error, response, body) {

        if(error == null) {
            //if (req.param('redirect') && req.param('redirect') == 'true') {
            req.session['facebook-signin'] = false;
            req.session['facebook-access-token'] = '';
            res.redirect('/login/');
            //}
        }else
        {
            winston.log('error', 'could not facebook logout');
        }
    });
}

function _handleFacebookOAuth(req, res) {
    if(req.query && req.query.code && req.query.state) {
        request({
            method: 'GET',
            url: 'https://graph.facebook.com/oauth/access_token?' +
                'client_id=' + config['facebook'].appId +
                '&redirect_uri=' + config['facebook'].redirectUriBase + '/facebook/oauth' +
                '&client_secret=' + config['facebook'].appSecret +
                '&code=' + req.query.code
        }, function(error, response, body) {

            _onAccessTokenResponse(req, res, error, response, body);
        });
        //Accounts.findByFacebookId()
        //TODO: check state matches the one in config
        //TODO: create/login user account with the given name and various other info
    } else {
        winston.log('error', 'could not get oauth token');
        res.redirect('/login/?error=facebook');
    }
}

function _onAccessTokenResponse(req, res, error, response, body) {
    var parsedBody = qs.parse(body);
    req.session['facebook-access-token'] = parsedBody.access_token;
    _makeMeRequest(req, res, parsedBody.access_token);
}

function _handleFacebookMeInfo(req, res) {
    _onMeResponse(req, res, undefined, undefined, JSON.stringify(req.body));
}

function _makeMeRequest(req, res, access_token) {
    var getUrl = 'https://graph.facebook.com/me?fields=id,first_name,last_name,picture,name,email' +
        '&access_token=' + access_token;

    request({
        method: 'GET',
        url: getUrl
    }, function(me_error, me_response, me_body) {
        _onMeResponse(req, res, me_error, me_response, me_body);
    });
}

function _onMeResponse(req, res, me_error, me_response, me_body) {
    if(me_error) {
        res.send('an error occurred when loading user info: ' + me_error);
        return;
    }
        var bodyAsJSON = JSON.parse(me_body);

    if(!bodyAsJSON.id) {
        res.send('could not get id from facebook', 500);
        return;
    }

    database.user_account.findOne({'facebook_data.id': bodyAsJSON.id}, function(err_find, data) {
        if(err_find) {
            res.send('an error occurred: ' + err_find);
            return;
        }

        // user exists, so just log in
        if(data != null) {
            user_util.setCaller(req, data);

            if(req.session['oauth-redirect']) {
                winston.debug('logged in from Facebook and going to redirect path');
                res.redirect(req.session['oauth-redirect']);
                return;
            }
            winston.debug('facebook login from registered user'); // TODO: show name or something?
            res.send(user_util.getSafeUser(data), 200);
            return;
        }

        async.series({
            try_update: function (callback) {

                // we query for existing users by email, so if we don't have it, move to the next step
                if (!bodyAsJSON.email) {
                    callback();
                    return;
                }

                database.user_account.findOne({email: general_util.getCaseInsensitiveProperty(bodyAsJSON.email)}, function(err_user, user) {
                    if(err_user) {
                        res.send(err_user, 500);
                        return;
                    }

                    // update facebook_data for existing user
                    if(user) {

                        database.user_account.update({_id: user._id}, {$set: {facebook_data: bodyAsJSON}}, function(err_update) { // , update_result
                            if(err_update) {
                                res.send(err_update, 500);
                                return;
                            }
                            res.send(user_util.getSafeUser(user), 200);
                        });
                        return;
                    }

                    // the user doesn't exist, so keep going
                    callback();
                });
            },

            try_add: function (callback) {

                // process the optional "add" parameter
                var allow_add = req.param('add');
                if (typeof(allow_add) != 'undefined' && allow_add == 'false') {
                    res.send(null, 200);
                    return;
                }

                var new_user = {
                    first_name: bodyAsJSON.first_name,
                    last_name: bodyAsJSON.last_name,
                    facebook_data: bodyAsJSON,
                    role: "user"
                };
                if (bodyAsJSON.email) {
                    new_user.email = bodyAsJSON.email;
                }

                if (bodyAsJSON.picture && bodyAsJSON.picture.data && bodyAsJSON.picture.data.url) {
                    new_user.image_url = bodyAsJSON.picture.data.url;
                }

                database.user_account.insert(new_user, function (err_insert, insert_result) {
                    if (err_insert) {
                        res.send('failed to create local user', 500);
                        return;
                    }

                    if (insert_result.length < 1) {
                        res.send('failed to create local user', 500);
                        return;
                    }
                    req.session['passport'].user = JSON.stringify(insert_result[0]);

                    if (req.session['oauth-redirect']) {
                        res.redirect('/');
                        return;
                    }
                    res.send(user_util.getSafeUser(insert_result[0]), 200);
                });
            }
        }, function(err_async, async_result) {
            // we shouldn't get here
            res.send('facebook login failed: email not provided by facebook', 500);
        });
    });
}