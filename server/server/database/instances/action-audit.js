var _ = require('underscore');
var async = require('async');
var config = require('config');
var schedule = require('node-schedule');
var winston = require('winston');

var database = require('./../database');
var event_handling = require('../../event-processing');
var general_util = require('../../util/general-utils');
var user_util = require('../../util/user-utils');

var db = database.init(config['audit_database'], _onConnected);

exports.db = db;

exports.reportEvent = _reportEvent; // this is the guy you refer to externally when something happens
exports.generateAuditRecord = _generateAuditRecord;

exports.registrations = db.collection('registrations');
exports.submissions = db.collection('submissions');
exports.where_to_buys = db.collection('where-to-buys');
exports.favorite_product = db.collection('favorite-product');
exports.favorite_brand = db.collection('favorite-brand');
exports.opt_in_brand = db.collection('opt-in-brand');
exports.opt_in_product = db.collection('opt-in-product');
exports.search = db.collection('search');
exports.surveys = db.collection('surveys');
exports.page_ratings = db.collection('page-ratings');
exports.logins = db.collection('logins');

// a specific product is scanned or clicked as a search result
exports.product_queries = db.collection('product-queries');

// a product search has been made
exports.product_searches = db.collection('product-searches');

// currently unused
exports.faq_hits = db.collection('faq-hits');
exports.views_video = db.collection('views-video');
exports.views_brand_message = db.collection('views-brand-message');

var buckets = {

    // # of registered users for each web/iPhone/android (where profile created)
    registrations:              new event_handling.UnkeyedEventBucket(exports.registrations),

    // # of messages by type
    submissions:                new event_handling.UnkeyedEventBucket(exports.submissions),
    where_to_buys:              new event_handling.UnkeyedEventBucket(exports.where_to_buys),
    favorite_brand:             new event_handling.UnkeyedEventBucket(exports.favorite_brand),
    favorite_product:           new event_handling.UnkeyedEventBucket(exports.favorite_product),
    opt_in_brand:               new event_handling.UnkeyedEventBucket(exports.opt_in_brand),
    opt_in_product:             new event_handling.UnkeyedEventBucket(exports.opt_in_product),
    product_queries:            new event_handling.UnkeyedEventBucket(exports.product_queries), // # searched, scanned, non-participating
    product_searches:           new event_handling.UnkeyedEventBucket(exports.product_searches),
    product_confirmed:          new event_handling.UnkeyedEventBucket(exports.product_confirmed),
    page_ratings:               new event_handling.UnkeyedEventBucket(exports.page_ratings),

    surveys:                    new event_handling.UnkeyedEventBucket(exports.surveys),

    faq_hits:                   new event_handling.UnkeyedEventBucket(exports.faq_hits),
    views_video:                new event_handling.UnkeyedEventBucket(exports.views_video),
    views_brand_message:        new event_handling.UnkeyedEventBucket(exports.views_brand_message),

    // # of times users come into the app – list of users with count
    logins:                     new event_handling.UnkeyedEventBucket(exports.logins)

    // product category hits
    // hits / views to video and brand message

    /*
     # submissions to CRM by Brand sent through 1. complaints 2. Share with Brand 3. Self help / may we help
     # where to buy requests – list of brands/products and counts
     # hits to FAQ by Brand / Product
     # hits to each Brand / Product Info category – Ingredient, Instruction, Product Label
     # hits / views to video and brand message
     # users tagged favorite brand – list of brands and counts
     # of products searched and confirmed – list of products and counts
     # of products scanned and confirmed – list of products and counts
     # hits for non-participating brands and who they are Brand / Product (Action! internal only)
    */

};

function _onConnected() {
    setInterval(_emptyAndStore, 5000);

    // TODO: add platform, as we aggregate it?
    exports.registrations.ensureIndex({timestamp: 1}, {background: true, unique: false}, function(err) {});
    exports.submissions.ensureIndex({timestamp: 1}, {background: true, unique: false}, function(err) {});
    exports.where_to_buys.ensureIndex({timestamp: 1}, {background: true, unique: false}, function(err) {});
}

function _emptyAndStore() {
    var async_tasks = [];
    _.each(_.keys(buckets), function(bucket_key) {
        var bucket = buckets[bucket_key];
        async_tasks.push(function(callback) {
            bucket.process(callback);
        });
    });

    async.series(async_tasks, function(err_empty, empty_result) {
        // LOG ERROR IF EXISTS?
    });
}

// asynchronously and safely reports an instance of some event
function _reportEvent(type, record) {
    var bucket = buckets[type];

    if(_.isUndefined(bucket)) {
        winston.error('when reporting an event, bucket type ' + type + ' not found');
        return;
    }

    general_util.runInBackground(function() {
        record.timestamp = new Date().valueOf();
        bucket.report(record);
    });
}

function _generateAuditRecord(req, data) {
    var to_return = _.extend({
        'host':         req.header('host'),
        'referer':      req.header('referer'),
        'user-agent':   req.header('user-agent'),
        'platform':     req.param('platform', 'web')
    }, data);

    var caller = user_util.getCaller(req);
    if(caller) {
        to_return['caller'] = caller._id;
    }

    return to_return;
}