var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var general_util = require('./general-utils');

var action_database = require('../database/instances/action');
var audit_database = require('../database/instances/action-audit');
var reports_database = require('../database/instances/action-report');

module.exports = {
    aggregateOnUsers: _aggregateOnUsers,
    aggregateOnPropertyAndUsers: _aggregateOnPropertyAndUsers,
    joinCollectionWithUsers: _joinCollectionWithUsers
};

// will aggregate a property that exists on an audit record that also exists for a user (e.g. age_range)
function _aggregateOnUsers(type, from_moment, to_moment, context, callback2) {
    //context = {
    // audit_collection,
    // report_collection,
    // user_property,
    // projected_name,
    // audit_record_user_id_property,
    // }

    var collection_name = type + '-temp', collection;
    async.series({

        'drop-collection': function(callback) {
            audit_database.db.dropCollection(collection_name, function() {
                callback();
            });
        },

        'create-collection': function(callback) {
            audit_database.db.createCollection(collection_name, function(err_create, created_collection) {
                if (err_create) {
                    callback(err_create);
                    return;
                }
                collection = created_collection;
                callback();
            });
        },

        'aggregate-login-counts': function(callback) {

            // we're going to aggregate logins-by-user into the temp database
            context.audit_collection.aggregate([
                    {
                        $match: {
                            $and: [
                                { timestamp: {$gte: from_moment.valueOf()} },
                                { timestamp: {$lt: to_moment.valueOf()} }
                            ]
                        }
                    },
                    {
                        $group : {
                            _id : "$" + context.audit_record_user_id_property,
                            count : { $sum : 1 }
                        }
                    },
                    {
                        $out: collection.collectionName
                    }
                ],
                function(err_aggregate) { // aggregate_result
                    if (err_aggregate) {
                        callback(err_aggregate);
                        return;
                    }

                    callback();
                }
            );
        },

        'join-users': function(callback) {
            _joinCollectionWithUsers(collection, callback);
        },

        'aggregate-property': function(callback) {
            var projection = {
                count: 1,
                _id: 0
            };
            projection[context.projected_name] = '$_id';
            collection.aggregate([
                    {
                        $group : {
                            _id : { $ifNull: [ "$" + context.user_property, "" ] } ,
                            count : { $sum : '$count' }
                        }
                    },
                    {
                        $project: projection
                    }
                ],
                function(err_aggregate, aggregate_result) {
                    if (err_aggregate) {
                        callback(err_aggregate);
                        return;
                    }

                    // TODO: I think the client should do this - we may not necessarily want in insert the result
                    context.report_collection.insert({
                        type: type,
                        from_time: from_moment.valueOf(),
                        to_time: to_moment.valueOf(),
                        values: aggregate_result
                    }, function(err_insert) {
                        callback(err_insert, aggregate_result);
                    });
                }
            );
        }

    }, function(err_async) { // , async_results
        audit_database.db.dropCollection(collection_name, function() {});

        if(err_async) {
            callback2(err_async);
            return;
        }
        callback2();
    });
}

// TODO: we need to do a page at a time, and go until we run out of pages
// will aggregate a property that exists on an audit record that also exists for a user (e.g. age_range)
// expects
function _aggregateOnPropertyAndUsers(type, from_moment, to_moment, context, callback2) {
    //context = {
    //   audit_database,
    //   audit_collection,
    //   report_collection,
    //   audit_property,
    //   user_property,
    //   projected_name,
    //   audit_record_user_id_property,
    //   timestamp_property (optional),
    //   preserved_properties
    // }

    var collection_name = type + '-temp', collection;
    async.series({

        'drop-collection': function(callback) {
            context.audit_database.db.dropCollection(collection_name, function() {
                callback();
            });
        },

        'create-collection': function(callback) {
            context.audit_database.db.createCollection(collection_name, function(err_create, created_collection) {
                if (err_create) {
                    winston.error('failed to create temporary collection: ' + err_create);
                    callback(err_create);
                    return;
                }
                collection = created_collection;
                callback();
            });
        },

        'aggregate-by-property': function(callback) {

            // prepare timestamp-based query
            var from = {}, to = {};
            if(context.timestamp_is_date) {
                from[context.timestamp_property] = {$gte: new Date(from_moment.valueOf())};
                to[context.timestamp_property] = {$lt: new Date(to_moment.valueOf())};
            } else {
                from[context.timestamp_property] = {$gte: from_moment.valueOf()};
                to[context.timestamp_property] = {$lt: to_moment.valueOf()};
            }
            var match_properties = { $and: [from, to] };

            // prepare group
            var group = {
                _id : "$" + context.audit_property,
                count : { $sum : 1 }, // TODO: this can almost certainly be removed
                users: {
                    $push: '$' + context.audit_record_user_id_property
                }
            };

            if(context.preserved_properties) {
                _.each(context.preserved_properties, function(property) {
                    group[property] = {$last: '$' + property}
                });
            }

            // prepare projection
            var projection = {
                _id: 0,
                count: 1,
                user_id: '$users'
            };
            projection[context.audit_property] = '$_id';

            if(context.preserved_properties) {
                _.each(context.preserved_properties, function(property) {
                    projection[property] = '$' + property
                });
            }

            // we're going to aggregate logins-by-user into the temp database
            context.audit_collection.aggregate([
                    {
                        $match: match_properties
                    },
                    {
                        $group : group
                    },
                    {
                        $unwind: '$users'
                    },
                    {
                        $project: projection
                    },
                    {
                        $out: collection.collectionName
                    }
                ],
                function(err_aggregate) { // aggregate_result
                    if (err_aggregate) {
                        winston.error('failed to aggregate by property: ' + err_aggregate);
                        callback(err_aggregate);
                        return;
                    }

                    callback();
                }
            );
        },

        'join-users': function(callback) {
            _joinCollectionWithUsers(collection, 'user_id', callback);
        },

        'aggregate-property': function(callback) {

            // combine audit property and user property together and do a count
            var group_step_1 = {
                $group : {
                    _id: {},
                    count : { $sum : 1 }
                }
            };
            group_step_1['$group']._id[context.projected_name] = {$ifNull: [ "$" + context.user_property, "" ] };
            group_step_1['$group']._id[context.audit_property] = '$' + context.audit_property;

            if(context.preserved_properties) {
                _.each(context.preserved_properties, function(property) {
                    group_step_1['$group'][property] = {$last: '$' + property}
                });
            }

            // prepare to group information beneath audit property
            var projection_1 = {
                _id: 0,
                counts: {}
            };
            projection_1[context.audit_property] = '$_id.' + context.audit_property;
            projection_1.counts[context.projected_name] = '$_id.' + context.projected_name;
            projection_1.counts.count = '$count';

            if(context.preserved_properties) {
                _.each(context.preserved_properties, function(property) {
                    projection_1[property] = 1;
                });
            }

            // group information beneath audit property, push total down to leaves
            var group_step_2 = {
                $group : {
                    _id: '$' + context.audit_property,
                    counts: {
                        $push: '$counts'
                    }
                }
            };

            if(context.preserved_properties) {
                _.each(context.preserved_properties, function(property) {
                    group_step_2['$group'][property] = {$last: '$' + property}
                });
            }

            // project the _id back to the audit_property provided
            var projection_2 = {
                _id: 0,
                counts: 1
            };
            projection_2[context.audit_property] = '$_id';

            if(context.preserved_properties) {
                _.each(context.preserved_properties, function(property) {
                    projection_2[property] = 1;
                });
            }

            // do the aggregation
            collection.aggregate([
                    group_step_1,
                    { $project: projection_1 },
                    group_step_2,
                    { $project: projection_2 }
                ],
                function(err_aggregate, aggregate_result) {
                    if (err_aggregate) {
                        winston.error('while aggregating final result: ' + err_aggregate);
                        callback(err_aggregate);
                        return;
                    }

                    context.report_collection.insert({
                        type: type,
                        from_time: from_moment.valueOf(),
                        to_time: to_moment.valueOf(),
                        values: aggregate_result
                    }, function(err_insert) {
                        callback(err_insert, aggregate_result);
                    });
                }
            );
        }

    }, function(err_async) { // , async_results
        context.audit_database.db.dropCollection(collection_name, function() {});

        if(err_async) {
            callback2(err_async);
            return;
        }
        callback2();
    });
}

function _joinCollectionWithUsers(collection, user_id_property, callback) {
    general_util.processMatchingCollectionItems(collection, 500, {}, {}, function(batch, batch_callback) {
        var ids = _.pluck(batch, user_id_property);
        var object_ids = _.map(ids, function(id){ return ObjectID(id);});
        action_database.user_account.find({_id: {$in: object_ids}}).toArray(function(err_user, users) {
            if(err_user) {
                callback(err_user);
                return;
            }

            _.each(batch, function(batch_record) {
                var user = _.find(users, function(user) { return user._id.toHexString() == batch_record[user_id_property]; });
                if(user) {
                    batch_record.batch_update_time = new Date();
                    batch_record = _.extend(batch_record, _.omit(user, ['count', '_id']));
                } else {
                    batch_record.batch_update_time = new Date();
                }
            });

            var removal_object = {};
            removal_object[user_id_property] = {$in: ids};
            collection.remove(removal_object, function(err_remove) {
                if(err_remove) {
                    callback(err_remove);
                    return;
                }

                collection.insert(batch, function(err_insert) { // , insert_results
                    batch_callback(err_insert);
                });
            });
        });
    }, callback);
}