var _ = require('underscore');
var async = require('async');
var winston = require('winston');

module.exports = {
    UnkeyedEventBucket: UnkeyedEventBucket,
    KeyedEventBucket: KeyedEventBucket
};

var MAX_BUFFER_SIZE = 1024;  // TODO: allow for variable-length buffers: logins may be need more than registrations, etc

function EventBucket(collection) {
    this._semaphore = require('semaphore')(1);
    this._collection = collection;
}

EventBucket.prototype.process = function(callback2) {
};

// buckets for simple dump and insert

UnkeyedEventBucket.prototype  = new EventBucket();
UnkeyedEventBucket.prototype.constructor = UnkeyedEventBucket;

function UnkeyedEventBucket(collection) {
    EventBucket.prototype.constructor.call(this, collection);
    this._queue = [];
}

UnkeyedEventBucket.prototype.report = function(value) {
    var that = this;
    this._semaphore.take(function() {
        if(that._queue.length < MAX_BUFFER_SIZE) {
            that._queue.push(value);
        } else {
            winston.debug('failed to insert into bucket ' + that._collection.collectionName + ' because the buffer was full');
        }
        that._semaphore.leave();
    });
};

UnkeyedEventBucket.prototype.process = function(callback2) {
    var that = this;
    this._semaphore.take(function() {

        // go through each item and upsert into DB
        if(that._queue.length == 0) {
            that._semaphore.leave();
            callback2();
            return;
        }

        var number_to_remove = Math.min(that._queue.length, MAX_BUFFER_SIZE);
        var items = that._queue.splice(0, number_to_remove);

        that._collection.insert(items, function(err_insert, insert_result) { // TODO: check err, count
            that._semaphore.leave();
            callback2(err_insert, insert_result);
        });
    });
};

// buckets for resources that have private keys

KeyedEventBucket.prototype  = new EventBucket();
KeyedEventBucket.prototype.constructor = KeyedEventBucket;

function KeyedEventBucket(collection) {
    EventBucket.prototype.constructor.call(this, collection);
    this._buffer = [];
}

KeyedEventBucket.prototype.report = function(key_hash, value) {
    var that = this;
    this._semaphore.take(function() {
        if(that._buffer.length < MAX_BUFFER_SIZE) {
            that._buffer.push({keys: key_hash, value: value});
        }
        that._semaphore.leave();
    });
};

KeyedEventBucket.prototype.process = function(callback2) {
    var that = this;
    this._semaphore.take(function() {

        // go through each item and upsert into DB
        var tasks = [];
        _.each(that._buffer, function(item) {
            tasks.push(function(callback) {
                var value = _.extend(item.value, item.keys);
                that._collection.update(item.keys, value, {upsert: true}, function(err_update, update_result) {
                    callback();
                });
            });
        });

        async.series(tasks, function(err_async, async_result) {
            that._buffer = [];
            that._semaphore.leave();
            callback2();
        });
    });
};
