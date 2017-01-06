var _ = require('underscore');
var config = require('config');
var request = require('request');
var winston = require('winston');
var user_util = require('../util/user-utils');
var database = require('../database/instances/action');
var async = require('async');

module.exports = {
    google_login: _handleGoogleLogin,
    google_logout: _handleGoogleLogout,
    google_oauth: _handleGoogleOAuth,
    google_me_info: _handleGoogleMeInfo
};

function _handleGoogleLogin(req, res) {
    if(!_.isUndefined(req.param('redirect')) && req.session) {
        req.session['oauth-redirect'] = req.param('redirect');
        req.session['google-signin'] = true;
        req.session.save();
    }

    var url = config.google.plus.auth_uri + '?' +
        'client_id=' + config.google.plus.client_id +
        '&state=' + config.google.plus.state +
        '&response_type=' + config.google.plus.responseType +
        '&scope=' + config.google.plus.scope +
        '&redirect_uri=' + config.google.plus.redirect_uris[0];
    res.redirect(url)
}

function _handleGoogleLogout(req, res) {

    var accessToken = req.session['google-access-token'];
    var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken;

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
                req.session['google-signin'] = false;
                req.session['google-access-token'] = '';
                res.redirect('/login/');
            //}
        }else
        {
            winston.log('error', 'could not google logout');
        }
    });


}

function _handleGoogleOAuth(req, res) {
    if(req.query && req.query.code && req.query.state) {
        var url = config.google.plus.token_uri;
        var body = 'client_id=' + config.google.plus.client_id +
            '&redirect_uri=' + config.google.plus.redirect_uris[0] +
            '&client_secret=' + config.google.plus.client_secret +
            '&code=' + req.query.code +
            '&grant_type=authorization_code';

        request({
            method: 'POST',
            url: url,
            body: body,
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded'
            }
        }, function(error, response, body) {
            _onAccessTokenResponse(req, res, error, response, body);
        });
        //Accounts.findByFacebookId()
        //TODO: check state matches the one in config
        //TODO: create/login user account with the given name and various other info
    } else {
        winston.log('error', 'could not get oauth token');
    }
}

function _handleGoogleMeInfo(req, res)
{

   _onMeResponse(req, res, undefined, undefined, JSON.stringify(req.body));

}

function _onAccessTokenResponse(req, res, error, response, body) {
    if(error) {
        res.send('an error occurred: ' + error + ', status code: ' + response.statusCode, 500);
        return;
    }

    var parsedBody = JSON.parse(body);
    var getUrl = 'https://www.googleapis.com/plus/v1/people/me?' +
        'access_token=' + parsedBody.access_token;

    req.session['google-access-token'] = parsedBody.access_token;
    request({
        method: 'GET',
        url: getUrl
    }, function(me_error, me_response, me_body) {
        _onMeResponse(req, res, me_error, me_response, me_body, parsedBody.access_token);
1    });
}



function _onMeResponse(req, res, me_error, me_response, me_body) {
    if(me_error) {
        res.send('an error occurred when loading user info: ' + me_error);
        return;
    }

    var bodyAsJSON = JSON.parse(me_body);

    if(!bodyAsJSON.id) {
        res.send('could not get id from google', 500);
        return;
    }

    database.user_account.findOne({'google_data.id': bodyAsJSON.id}, function(err_find, data) {
        if(err_find) {
            res.send('an error occurred: ' + err_find);
            return;
        }

        // user exists, so just log in
        if(data != null) {
            user_util.setCaller(req, data);

            if(req.session['oauth-redirect']) {
                winston.debug('logged in from Google and going to redirect path');
                res.redirect(req.session['oauth-redirect']);
                return;
            }
            winston.debug('google login from registered user'); // TODO: show name or something?
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

                    // update google_data for existing user
                    if(user) {

                        database.user_account.update({_id: user._id}, {$set: {google_data: bodyAsJSON}}, function(err_update) { // , update_result
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
                    first_name: bodyAsJSON.name.givenName,
                    last_name: bodyAsJSON.name.familyName,
                    google_data: bodyAsJSON,
                    google_id: bodyAsJSON.id,
                    role: "user"
                };

                if(bodyAsJSON.emails && bodyAsJSON.emails.length > 0) {
                    new_user.email = bodyAsJSON.emails[0].value;
                }

                if (bodyAsJSON.image && bodyAsJSON.image.url && bodyAsJSON.image.url) {
                    new_user.image_url = bodyAsJSON.image.url;
                }

                if(bodyAsJSON.birthday)
                {
                    new_user.date_of_birth = bodyAsJSON.birthday;
                }

                if(bodyAsJSON.gender)
                {
                    new_user.gender = bodyAsJSON.gender == 'male'?1:2;
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
            res.send('google login failed: email not provided by google', 500);
        });
    });
}