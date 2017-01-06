var crypto = require('crypto');
var passport = require('passport');
var passport_strategy = require('passport-local').Strategy;
var winston = require('winston');

var db = require('./database/instances/action');
var products = require('./routes/products');
var general_util = require('./util/general-utils');

module.exports = {
    init: _init,

    ensureAuthenticated: _ensureAuthenticated,
    ensureAuthenticatedForView: _ensureAuthenticatedForView,
    ensureTrueAdmin: _ensureTrueAdmin,
    ensureAdmin: _ensureAdmin,
    ensureAdminForView: _ensureAdminForView,
    ensureNonUser: _ensureNonUser,
    ensureNonUserForView: _ensureNonUserForView,

    saltAndHash: _saltAndHash,
    validatePassword: _validatePassword
};

function _init() {
    passport.use('local-simple', new passport_strategy({ qop: 'auth', usernameField: 'email' },
        function(email, password, done) {
            db.user_account.findOne({ email: general_util.getCaseInsensitiveProperty(email) }, function(err, user) {
                if(err) {
                    return done(err);
                }
                if(!user) {
                    return done(null, false, { message: 'Invalid credentials' }); // 'Incorrect email.'
                }
                if(!user.password) {
                    winston.warn(user.name + ' had no password when logging in');
                    return done(null, false, { message: 'Invalid credentials' }); // 'Incorrect email.'
                }
                if(_validatePassword(password, user.password)) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Invalid credentials' }); // 'Incorrect password.'
                }
            });
        }
    ));
}

passport.serializeUser(function(asString, done) {
    done(null, JSON.stringify(asString));
});

passport.deserializeUser(function(asObject, done) {
    done(null, JSON.stringify(asObject));
});

// Simple route middle-ware to ensure user is authenticated.
//   Use this route middle-ware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function _ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.send('not found', 404);
}

// Just like the one above, except it assumes we are serving up a view
function _ensureAuthenticatedForView(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.statusCode = 404;
    return res.redirect('/login?redirect=' + encodeURIComponent(req.path));
}

function _ensureAdminForView(req, res, next) {
    var caller = JSON.parse(req.session['passport'].user);
    if (caller['role'] && (caller['role'] == 'admin' || caller['role'] == 'action-admin')) {
        return next();
    }
    res.statusCode = 404;
    return res.redirect('/login?redirect=' + encodeURIComponent(req.path));
}

function _ensureNonUserForView(req, res, next) {
    var caller = JSON.parse(req.session['passport'].user);
    if (caller['role'] && (caller['role'] == 'admin' || caller['role'] == 'action-admin') || caller['role'] == 'brand-manager') {
        return next();
    }
    res.statusCode = 404;
    return res.redirect('/login?redirect=' + encodeURIComponent(req.path));
}

function _ensureAdmin(req, res, next) {
    var caller = JSON.parse(req.session['passport'].user);
    if (caller['role'] && (caller['role'] == 'admin' || caller['role'] == 'action-admin')) {
        return next();
    }
    general_util.send404(res);
}

function _ensureTrueAdmin(req, res, next) {
    var caller = JSON.parse(req.session['passport'].user);
    if (caller['role'] && caller['role'] == 'admin') {
        return next();
    }
    general_util.send404(res);
}

function _ensureNonUser(req, res, next) {
    var caller = JSON.parse(req.session['passport'].user);
    if (caller['role'] && (caller['role'] == 'admin' || caller['role'] == 'brand-manager' || caller['role'] == 'action-admin')) {
        return next();
    }
    general_util.send404(res);
}

/* private encryption & validation methods */

function _saltAndHash(pass) {
    var salt = generateSalt();
    return salt + md5(pass + salt);
}

var generateSalt = function() {
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * set.length);
        salt += set[p];
    }
    return salt;
};

var md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
};

function _validatePassword(plainPass, hashedPass) {
    var salt = hashedPass.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    return hashedPass === validHash;
}