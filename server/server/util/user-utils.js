var _ = require('underscore');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var action_database = require('../database/instances/action');

var general_util = require('./general-utils');

module.exports = {
    getSafeUserById: _getSafeUserById,
    generateGravatar: _generateGravatar,
    getSafeUser: _getSafeUser,
    getCaller: _getCaller,
    setCaller: _setCaller,
    canEditUser: _canEditUser,
    canEditBrand: _canEditBrand,
    recalculateAges: _recalculateAges,
    setAgeFields: _setAgeFields
};

// TODO: requiring the collection is kinda silly...
function _getSafeUserById(collection, caller, id, errorCallback, resultCallback) {
    if(!general_util.isValidId(id)) {
        errorCallback('invalid id', 500);
        return;
    }

    // we load the record from the db instead of using the caller in the session (in the event id == caller._id)
    // because the session data is generally considered to not be up-to-date
    if(!_canEditUser(caller, id)) {
        errorCallback('not found', 404);
        return;
    }

    collection.findOne({_id: ObjectID(id)}, function(err, user) {
        if(err != null) {
            errorCallback(err, 500);
            return;
        }
        if(user == null) {
            errorCallback('not found', 404);
            return;
        }
        resultCallback(_getSafeUser(user));
    });
}

function _generateGravatar(email) {
    return crypto.createHash('md5').update(email).digest("hex");
}

function _getCaller(req) {
    if(_.isUndefined(req.session['passport'])) {
        return;
    }

    if(_.isUndefined(req.session['passport'].user)) {
        return;
    }

    var user_data = JSON.parse(req.session['passport'].user);
    user_data = _getSafeUser(user_data);

    return user_data;
}

function _setCaller(req, caller) {
    req.session['passport'].user = JSON.stringify(caller);
    req.session.save();
}

function _getSafeUser(user) {
    return _.omit(user, 'password');
}

function _canEditUser(caller, user_id) {
    return caller.role == 'admin' || caller.role == 'action-admin' || caller._id == user_id;
}

function _canEditBrand(caller, brand_id) {
    if(caller.role == 'admin' || caller.role == 'action-admin') {
        return true;
    }

    if(_.isUndefined(caller.managed_brands)) {
        return false;
    }
    return _.indexOf(caller.managed_brands, brand_id) != -1;
}

function _recalculateAges() {
    winston.info('began recalculating user ages');

    var fields = {
        _id: 1,
        dob: 1
    };

    // could probably streamline the query to look for people with today as their birthday (e.g. DD/MM/* match)
    general_util.processMatchingCollectionItems(action_database.user_account, 2000, {dob: {$exists: true}}, fields, _recalculateAgeMutator, function(err_process, process_result) {
        winston.info('completed age calculation job');
    });
}

function _recalculateAgeMutator(users, callback2) {
    var users_with_invalid_dates = [];
    var update_tasks = [];

    users.forEach(function(user) {
        if(user.dob && user.dob.trim().length > 0) {
            if(!_setAgeFields(user)) {
                users_with_invalid_dates.push(user._id);
            } else {
                update_tasks.push(function(callback_async) {
                    action_database.user_account.update(
                        {
                            _id: user._id
                        },
                        {
                            $set: {
                                age: user.age,
                                age_range: user.age_range,
                                batch_update_time: new Date()
                            }
                        },
                        function(err_update) {
                            callback_async(err_update);
                        }
                    );
                });
            }

        } else {
            users_with_invalid_dates.push(user._id);
        }
    });

    update_tasks.push(function(callback_async) {
        if(users_with_invalid_dates.length == 0) {
            callback_async();
            return;
        }

        action_database.user_account.update(
            {
                _id: {$in: users_with_invalid_dates}
            },
            {
                $set: {
                    batch_update_time: new Date()
                }
            },
            {
                multi: true
            },
            function(err_update) {
                callback_async(err_update);
            }
        );
    });

    async.series(update_tasks, function(err_async) {
        callback2(err_async);
    });
}

function _setAgeFields(user) {
    var dob_moment = moment.utc(user.dob, 'MM-DD-YYYY');

    if(!dob_moment.isValid()) {
        return false;
    }

    user.age = moment.utc().diff(dob_moment, 'years');

    if(user.age <= 12) {
        user.age_range = '2';
    } else if(user.age <= 17) {
        user.age_range = '3';
    } else if(user.age <= 20) {
        user.age_range = '4';
    } else if(user.age <= 34) {
        user.age_range = '5';
    } else if(user.age <= 54) {
        user.age_range = '6';
    } else {
        user.age_range = '7';
    }

    return true;
}