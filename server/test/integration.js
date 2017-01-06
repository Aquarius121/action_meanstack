// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js


var _ = require('underscore');

var utilities = require('./test-utilities');
var values = require('./test-values');

var admins = require('./unit-admins');
var brand_owners = require('./unit-brand-owner');
var brands = require('./unit-brands');
var cleanup = require('./test-cleanup');
var favorites = require('./unit-favorites');
var messages = require('./unit-messages');
var opt_ins = require('./unit-opt-ins');
var products = require('./unit-products');
var users = require('./unit-users');

process.setMaxListeners(0);

module.exports = {

    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    integration: {
        users: users,
        brands: brands,
        brand_owners: brand_owners,
        admins: admins,
        products: products,
        messages: messages,
        favorites: favorites,
        opt_ins: opt_ins,
        cleanup: cleanup
    }
};